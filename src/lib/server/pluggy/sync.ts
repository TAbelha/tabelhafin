import { AccountType } from "$lib/enums/account-type";
import { categorizeTransactions } from "$lib/server/ai/categorize";
import { categorizeByRules } from "$lib/server/ai/rules";
import { decryptSecret } from "$lib/server/crypto";
import { getDb } from "$lib/server/db";
import { upsertAccount } from "$lib/server/db/accounts";
import { getAiCredentials } from "$lib/server/db/ai-credentials";
import { getRulesByUser } from "$lib/server/db/categorization-rules";
import { getPluggyCredentials } from "$lib/server/db/pluggy-credentials";
import {
  getAllPluggyItems,
  getPluggyItemsByUser,
  updateLastSyncAttemptAt,
  updateLastSyncedAt,
  upsertPluggyItem,
} from "$lib/server/db/pluggy-items";
import { financeAccounts, transactions } from "$lib/server/db/schema";
import { applyTagRules } from "$lib/server/db/tag-rules";
import {
  findSupersedeCandidate,
  getExistingPluggyIds,
  getUncategorizedTransactions,
  insertPluggyTransaction,
  markSuperseded,
  updatePluggyFields,
} from "$lib/server/db/transactions";
import { getUserAiPrompts } from "$lib/server/db/user-ai-prompts";
import { getCategoriesByUser } from "$lib/server/db/user-categories";
import { findUserById } from "$lib/server/db/users";
import type { AiProvider } from "$lib/utils/ai-providers";

import { and, eq, gte, inArray, isNull, notInArray, or } from "drizzle-orm";

import {
  fetchAccounts,
  fetchInvestments,
  fetchItems,
  fetchTransactions,
} from "./client";
import { computeDedupeHash } from "./dedupe";
import {
  INTERNAL_TRANSFER_CATEGORIES,
  INTERNAL_TRANSFER_DESCRIPTIONS,
  isSelfTransferByDescription,
} from "./internal-transfers";

type Db = ReturnType<typeof getDb>;
type PluggyItemRow = Awaited<ReturnType<typeof getAllPluggyItems>>[number];

export async function syncAllUsers(env: Env): Promise<void> {
  const db = getDb(env.DB);
  const items = await getAllPluggyItems(db);

  const itemsByUser = new Map<string, PluggyItemRow[]>();
  for (const item of items) {
    const list = itemsByUser.get(item.userId) ?? [];
    list.push(item);
    itemsByUser.set(item.userId, list);
  }

  for (const userId of itemsByUser.keys()) {
    try {
      await syncUserItems(db, env.MASTER_KEY, userId, {
        items: itemsByUser.get(userId),
      });
    } catch (err) {
      console.error("[pluggy/sync] falha ao sincronizar usuário", {
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }
}

export interface SyncUserItemsOptions {
  items?: PluggyItemRow[];
  skipAiCategorization?: boolean;
}

export async function syncUserItems(
  db: Db,
  masterKey: string,
  userId: string,
  options: SyncUserItemsOptions = {},
): Promise<void> {
  const { items, skipAiCategorization = false } = options;
  const credentials = await getPluggyCredentials(db, userId);
  if (!credentials) {
    console.error(
      "[pluggy/sync] usuário sem pluggy_credentials salvas, pulando",
      { userId },
    );
    return;
  }
  const token = await decryptSecret(
    masterKey,
    {
      ciphertext: credentials.tokenEncrypted,
      nonce: credentials.tokenNonce,
      v: credentials.v ?? undefined,
    },
    { purpose: "pluggy_credentials", userId },
  );

  const pluggyItems = await fetchItems(token);
  for (const pluggyItem of pluggyItems) {
    await upsertPluggyItem(db, {
      userId,
      pluggyItemId: pluggyItem.id,
      institutionName: pluggyItem.institutionName,
      institutionType: pluggyItem.institutionType,
      status: pluggyItem.status,
    });
  }

  const userItems = items ?? (await getPluggyItemsByUser(db, userId));

  for (const item of userItems) {
    await updateLastSyncAttemptAt(db, item.id, new Date());
    try {
      await syncItem(db, token, item);
      await updateLastSyncedAt(db, item.id, new Date());
    } catch (err) {
      console.error("[pluggy/sync] failed to sync item", {
        userId: item.userId,
        itemId: item.id,
        pluggyItemId: item.pluggyItemId,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  await reportOrphanTransactions(db, userId);
  await markInternalTransfers(db, userId);
  await markSelfTransfersByName(db, userId);
  await applyTagRules(db, userId);
  await categorizeNewTransactions(db, masterKey, userId, {
    skipAi: skipAiCategorization,
  });
}

async function reportOrphanTransactions(db: Db, userId: string): Promise<void> {
  const rows = await db
    .select({ id: transactions.id })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.source, "pluggy"),
        isNull(transactions.accountId),
        isNull(transactions.supersededByTransactionId),
      ),
    );
  if (rows.length === 0) return;

  console.error("[pluggy/sync] transações sincronizadas sem conta vinculada", {
    userId,
    count: rows.length,
    impact: "income/expense sign is wrong for credit card rows",
  });
}

const MIRROR_WINDOW_MS = 2 * 24 * 60 * 60 * 1000;

type MirrorRow = {
  id: string;
  accountId: string | null;
  amount: number;
  date: Date;
};

export function pairMirrors(rows: MirrorRow[]): string[] {
  const credits = rows
    .filter((r) => r.amount > 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const debits = rows
    .filter((r) => r.amount < 0)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const paired: string[] = [];
  const taken = new Set<string>();

  for (const credit of credits) {
    let best: MirrorRow | undefined;
    let bestDistance = Infinity;

    for (const debit of debits) {
      if (taken.has(debit.id)) continue;
      if (debit.accountId === credit.accountId) continue;
      const distance = Math.abs(credit.date.getTime() - debit.date.getTime());
      if (distance <= MIRROR_WINDOW_MS && distance < bestDistance) {
        best = debit;
        bestDistance = distance;
      }
    }

    if (best) {
      taken.add(best.id);
      paired.push(credit.id, best.id);
    }
  }

  return paired;
}

async function markInternalTransfers(db: Db, userId: string): Promise<void> {
  const since = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000);

  const rows = await db
    .select({
      id: transactions.id,
      accountId: transactions.accountId,
      amount: transactions.amount,
      date: transactions.date,
    })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.supersededByTransactionId),
        gte(transactions.date, since),
        or(
          isNull(transactions.pluggyCategory),
          notInArray(transactions.pluggyCategory, [
            ...INTERNAL_TRANSFER_CATEGORIES,
          ]),
        ),
        notInArray(transactions.description, [
          ...INTERNAL_TRANSFER_DESCRIPTIONS,
        ]),
      ),
    );

  if (rows.length === 0) return;

  const accountIds = new Set(
    rows.map((r) => r.accountId).filter((id): id is string => Boolean(id)),
  );
  if (accountIds.size < 2) return;

  const accountRows = await db
    .select({ id: financeAccounts.id, type: financeAccounts.type })
    .from(financeAccounts)
    .where(
      and(
        eq(financeAccounts.userId, userId),
        inArray(financeAccounts.id, [...accountIds]),
      ),
    );

  const accountTypeById = new Map(
    accountRows.map((a) => [a.id, a.type as AccountType]),
  );

  const groups = new Map<string, (typeof rows)[number][]>();
  for (const row of rows) {
    if (!row.accountId) continue;
    const accType = accountTypeById.get(row.accountId);
    if (accType === AccountType.CreditCard) continue;
    const key = String(Math.abs(row.amount));
    const list = groups.get(key) ?? [];
    list.push(row);
    groups.set(key, list);
  }

  const toMark = new Set<string>();

  for (const group of groups.values()) {
    for (const id of pairMirrors(group)) toMark.add(id);
  }

  if (toMark.size > 0) {
    await db
      .update(transactions)
      .set({ pluggyCategory: "Internal transfer" })
      .where(inArray(transactions.id, [...toMark]));
  }
}

async function markSelfTransfersByName(db: Db, userId: string): Promise<void> {
  const user = await findUserById(db, userId);
  if (!user || !user.name.trim()) return;

  const rows = await db
    .select({ id: transactions.id, description: transactions.description })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.supersededByTransactionId),
        or(
          isNull(transactions.pluggyCategory),
          notInArray(transactions.pluggyCategory, [
            ...INTERNAL_TRANSFER_CATEGORIES,
          ]),
        ),
      ),
    );

  const toMark = rows
    .filter((r) => isSelfTransferByDescription(r.description, user.name))
    .map((r) => r.id);
  if (toMark.length > 0) {
    await db
      .update(transactions)
      .set({ pluggyCategory: "Internal transfer" })
      .where(inArray(transactions.id, toMark));
  }
}

async function categorizeNewTransactions(
  db: Db,
  masterKey: string,
  userId: string,
  options: { skipAi?: boolean } = {},
): Promise<void> {
  const pending = await getUncategorizedTransactions(db, userId);
  if (pending.length === 0) return;

  const rules = await getRulesByUser(db, userId);
  if (rules.length > 0) {
    const ruleByDescription = new Map(
      rules.map((r) => [r.description, r.category]),
    );
    const idsByCategory = new Map<string, string[]>();
    for (const tx of pending) {
      const category = ruleByDescription.get(tx.description);
      if (!category) continue;
      const ids = idsByCategory.get(category) ?? [];
      ids.push(tx.id);
      idsByCategory.set(category, ids);
    }
    for (const [category, ids] of idsByCategory) {
      await db
        .update(transactions)
        .set({ category, categorySource: "rule" })
        .where(inArray(transactions.id, ids));
    }
  }

  const byKeyword = await getUncategorizedTransactions(db, userId);
  const idsByRuleCategory = new Map<string, string[]>();
  for (const tx of byKeyword) {
    const category = categorizeByRules(tx.description);
    if (!category) continue;
    const ids = idsByRuleCategory.get(category) ?? [];
    ids.push(tx.id);
    idsByRuleCategory.set(category, ids);
  }
  for (const [category, ids] of idsByRuleCategory) {
    await db
      .update(transactions)
      .set({ category, categorySource: "rule" })
      .where(inArray(transactions.id, ids));
  }

  const stillPending = await getUncategorizedTransactions(db, userId);
  if (stillPending.length === 0) return;

  if (options.skipAi) return;

  const user = await findUserById(db, userId);
  if (user && !user.aiCategorizationEnabled) return;

  const aiCredentials = await getAiCredentials(db, userId);
  if (!aiCredentials) {
    console.error(
      "[pluggy/sync] usuário sem ai_credentials, transações ficam sem categoria",
      {
        userId,
        pendingCount: stillPending.length,
      },
    );
    return;
  }

  const apiKey = await decryptSecret(
    masterKey,
    {
      ciphertext: aiCredentials.keyEncrypted,
      nonce: aiCredentials.nonce,
      v: aiCredentials.v ?? undefined,
    },
    { purpose: "ai_credentials", userId },
  );

  const userCategories = await getCategoriesByUser(db, userId);
  const prompts = await getUserAiPrompts(db, userId);

  const results = await categorizeTransactions({
    provider: aiCredentials.provider as AiProvider,
    model: aiCredentials.model,
    apiKey,
    categories: userCategories.map((c) => c.name),
    customPrompt: prompts.categorizationPrompt ?? undefined,
    transactions: stillPending.map((t) => ({
      id: t.id,
      description: t.description,
      amount: t.amount,
      date: t.date.toISOString().slice(0, 10),
    })),
  });

  const idsByAiCategory = new Map<string, string[]>();
  for (const result of results) {
    const ids = idsByAiCategory.get(result.category) ?? [];
    ids.push(result.id);
    idsByAiCategory.set(result.category, ids);
  }
  for (const [category, ids] of idsByAiCategory) {
    await db
      .update(transactions)
      .set({ category, categorySource: "ai" })
      .where(inArray(transactions.id, ids));
  }
}

async function syncItem(
  db: Db,
  token: string,
  item: PluggyItemRow,
): Promise<void> {
  const pluggyAccounts = await fetchAccounts(token, [item.pluggyItemId]);
  for (const pluggyAccount of pluggyAccounts) {
    const account = await upsertAccount(db, {
      userId: item.userId,
      pluggyItemId: item.id,
      pluggyAccountId: pluggyAccount.id,
      institution: item.institutionName,
      type: pluggyAccount.type,
      name: pluggyAccount.name,
      currency: pluggyAccount.currency,
      cachedBalance: pluggyAccount.balance,
    });

    const since = item.lastSyncedAt
      ? new Date(item.lastSyncedAt.getTime() - 7 * 24 * 60 * 60 * 1000)
      : undefined;
    const pluggyTransactions = await fetchTransactions(
      token,
      [pluggyAccount.id],
      since,
    );

    const existingIds = await getExistingPluggyIds(
      db,
      pluggyTransactions.map((tx) => tx.id),
    );

    for (const tx of pluggyTransactions) {
      const txDate = new Date(tx.date);

      if (existingIds.has(tx.id)) {
        await updatePluggyFields(db, tx.id, {
          category: tx.category,
          amount: tx.amount,
          accountId: account.id,
        });
        continue;
      }

      const inserted = await insertPluggyTransaction(db, {
        userId: item.userId,
        accountId: account.id,
        pluggyTransactionId: tx.id,
        date: txDate,
        description: tx.description,
        amount: tx.amount,
        currency: tx.currency,
        pluggyCategory: tx.category,
        dedupeHash: computeDedupeHash(account.id, tx.amount, txDate),
      });
      if (!inserted) continue;

      const supersedeCandidate = await findSupersedeCandidate(
        db,
        item.userId,
        account.id,
        tx.amount,
        txDate,
      );
      if (supersedeCandidate) {
        await markSuperseded(db, supersedeCandidate.id, inserted.id);
      }
    }
  }

  const pluggyInvestments = await fetchInvestments(token, [item.pluggyItemId]);
  for (const investment of pluggyInvestments) {
    await upsertAccount(db, {
      userId: item.userId,
      pluggyItemId: item.id,
      pluggyAccountId: investment.id,
      institution: item.institutionName,
      type: AccountType.Investment,
      name: investment.name,
      currency: investment.currency,
      cachedBalance: investment.balance,
    });
  }
}
