import { AccountType } from "$lib/enums/account-type";
import { getRuleForDescription } from "$lib/server/db/categorization-rules";
import {
  INTERNAL_TRANSFER_CATEGORIES,
  INTERNAL_TRANSFER_DESCRIPTIONS,
} from "$lib/server/pluggy/internal-transfers";
import type { TransactionCategory } from "$lib/utils/categories";

import {
  and,
  eq,
  gt,
  gte,
  inArray,
  isNull,
  lte,
  ne,
  notInArray,
  or,
  sql,
} from "drizzle-orm";

import type { getDb } from "./index";
import { transactions } from "./schema";

type Db = ReturnType<typeof getDb>;

export const isNotInternalTransfer = and(
  or(
    isNull(transactions.pluggyCategory),
    notInArray(transactions.pluggyCategory, [...INTERNAL_TRANSFER_CATEGORIES]),
  ),
  or(
    isNull(transactions.description),
    notInArray(transactions.description, [...INTERNAL_TRANSFER_DESCRIPTIONS]),
  ),
);

export function visibleTransactions(userId: string) {
  return and(
    eq(transactions.userId, userId),
    isNull(transactions.supersededByTransactionId),
  );
}

export async function getTransactionsByUser(db: Db, userId: string) {
  return db.select().from(transactions).where(visibleTransactions(userId));
}

export interface MovementSplit {
  expense: number;
  income: number;
}

export function classifyMovement(
  accountType: AccountType | null | undefined,
  amount: number,
): MovementSplit {
  if (accountType === AccountType.CreditCard) {
    return { expense: amount, income: 0 };
  }
  return amount >= 0
    ? { expense: 0, income: amount }
    : { expense: -amount, income: 0 };
}

export interface TransactionSummary {
  income: number;
  expense: number;
  categoryTotals: Record<string, number>;
}

export function summarizeTransactions(
  rows: (typeof transactions.$inferSelect)[],
  accountTypeById: Map<string, AccountType>,
): TransactionSummary {
  let income = 0;
  let expense = 0;
  const categoryTotals: Record<string, number> = {};
  for (const tx of rows) {
    const accType = tx.accountId
      ? accountTypeById.get(tx.accountId)
      : undefined;
    const split = classifyMovement(accType, tx.amount);
    income += split.income;
    expense += split.expense;
    if (split.expense !== 0) {
      const category = tx.category ?? "Outros";
      categoryTotals[category] =
        (categoryTotals[category] ?? 0) + split.expense;
    }
  }
  return { income, expense, categoryTotals };
}

export interface NewPluggyTransactionInput {
  userId: string;
  accountId: string;
  pluggyTransactionId: string;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  pluggyCategory: string | null;
  dedupeHash: string;
}

export async function getTransactionByPluggyId(
  db: Db,
  pluggyTransactionId: string,
) {
  const [row] = await db
    .select()
    .from(transactions)
    .where(eq(transactions.pluggyTransactionId, pluggyTransactionId));
  return row ?? null;
}

const EXISTING_ID_CHUNK = 200;

export async function getExistingPluggyIds(
  db: Db,
  pluggyTransactionIds: string[],
): Promise<Set<string>> {
  const found = new Set<string>();
  for (let i = 0; i < pluggyTransactionIds.length; i += EXISTING_ID_CHUNK) {
    const chunk = pluggyTransactionIds.slice(i, i + EXISTING_ID_CHUNK);
    if (chunk.length === 0) continue;
    const rows = await db
      .select({ pluggyTransactionId: transactions.pluggyTransactionId })
      .from(transactions)
      .where(inArray(transactions.pluggyTransactionId, chunk));
    for (const row of rows) {
      if (row.pluggyTransactionId) found.add(row.pluggyTransactionId);
    }
  }
  return found;
}

export async function updatePluggyFields(
  db: Db,
  pluggyTransactionId: string,
  fields: { category: string | null; amount: number; accountId: string },
) {
  await db
    .update(transactions)
    .set({
      pluggyCategory: fields.category,
      amount: fields.amount,
      accountId: fields.accountId,
    })
    .where(eq(transactions.pluggyTransactionId, pluggyTransactionId));
}

export async function insertPluggyTransaction(
  db: Db,
  input: NewPluggyTransactionInput,
) {
  const rule = await getRuleForDescription(db, input.userId, input.description);

  const [saved] = await db
    .insert(transactions)
    .values({
      userId: input.userId,
      accountId: input.accountId,
      pluggyTransactionId: input.pluggyTransactionId,
      date: input.date,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      source: "pluggy",
      pluggyCategory: input.pluggyCategory,
      category: rule?.category ?? null,
      categorySource: rule ? "rule" : null,
      dedupeHash: input.dedupeHash,
    })
    .onConflictDoUpdate({
      target: transactions.pluggyTransactionId,
      set: { pluggyCategory: input.pluggyCategory },
    })
    .returning();
  return saved ?? null;
}

export interface NewPdfTransactionInput {
  userId: string;
  statementUploadId: string;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  category: TransactionCategory;
}

export async function insertPdfTransaction(
  db: Db,
  input: NewPdfTransactionInput,
) {
  const covering = await findTransactionCoveringPdfRow(
    db,
    input.userId,
    input.amount,
    input.date,
  );

  const [saved] = await db
    .insert(transactions)
    .values({
      userId: input.userId,
      statementUploadId: input.statementUploadId,
      date: input.date,
      description: input.description,
      amount: input.amount,
      currency: input.currency,
      source: "pdf_upload",
      category: input.category,
      categorySource: "ai",
      dedupeHash: null,
      supersededByTransactionId: covering?.id ?? null,
    })
    .returning();
  return { transaction: saved, supersededBy: covering?.id ?? null };
}

export interface NewManualTransactionInput {
  userId: string;
  accountId?: string | null;
  date: Date;
  description: string;
  amount: number;
  currency: string;
  category: TransactionCategory | null;
  notes?: string | null;
}

export async function insertManualTransaction(
  db: Db,
  input: NewManualTransactionInput,
) {
  const [saved] = await db
    .insert(transactions)
    .values({
      userId: input.userId,
      accountId: input.accountId ?? null,
      date: input.date,
      description: input.description,
      amount: input.amount,
      currency: input.currency ?? "BRL",
      source: "manual",
      category: input.category,
      categorySource: input.category ? "user" : null,
      dedupeHash: null,
    })
    .returning();
  return saved;
}

const SUPERSEDE_TOLERANCE_DAYS = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

export async function findSupersedeCandidate(
  db: Db,
  userId: string,
  accountId: string,
  amount: number,
  date: Date,
) {
  const from = new Date(date.getTime() - SUPERSEDE_TOLERANCE_DAYS * DAY_MS);
  const to = new Date(date.getTime() + SUPERSEDE_TOLERANCE_DAYS * DAY_MS);
  const [row] = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        eq(transactions.source, "pdf_upload"),
        eq(sql`abs(${transactions.amount})`, Math.abs(amount)),
        isNull(transactions.supersededByTransactionId),
        gte(transactions.date, from),
        lte(transactions.date, to),
        or(
          eq(transactions.accountId, accountId),
          isNull(transactions.accountId),
        ),
      ),
    );
  return row ?? null;
}

export function amountsMatchForDedupe(a: number, b: number): boolean {
  return Math.abs(a) === Math.abs(b);
}

export function isWithinSupersedeWindow(a: Date, b: Date): boolean {
  return (
    Math.abs(a.getTime() - b.getTime()) <= SUPERSEDE_TOLERANCE_DAYS * DAY_MS
  );
}

export async function findTransactionCoveringPdfRow(
  db: Db,
  userId: string,
  amount: number,
  date: Date,
) {
  const from = new Date(date.getTime() - SUPERSEDE_TOLERANCE_DAYS * DAY_MS);
  const to = new Date(date.getTime() + SUPERSEDE_TOLERANCE_DAYS * DAY_MS);
  const candidates = await db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        ne(transactions.source, "pdf_upload"),
        isNull(transactions.supersededByTransactionId),
        gte(transactions.date, from),
        lte(transactions.date, to),
      ),
    );
  return (
    candidates.find((row) => amountsMatchForDedupe(row.amount, amount)) ?? null
  );
}

export async function markSuperseded(
  db: Db,
  oldTransactionId: string,
  newTransactionId: string,
): Promise<void> {
  await db
    .update(transactions)
    .set({ supersededByTransactionId: newTransactionId })
    .where(eq(transactions.id, oldTransactionId));
}

export async function renameCategoryOnTransactions(
  db: Db,
  userId: string,
  oldName: string,
  newName: string,
): Promise<void> {
  await db
    .update(transactions)
    .set({ category: newName })
    .where(
      and(eq(transactions.userId, userId), eq(transactions.category, oldName)),
    );
}

export async function clearCategoryOnTransactions(
  db: Db,
  userId: string,
  name: string,
): Promise<void> {
  await db
    .update(transactions)
    .set({ category: null, categorySource: null })
    .where(
      and(eq(transactions.userId, userId), eq(transactions.category, name)),
    );
}

export async function getUncategorizedTransactions(db: Db, userId: string) {
  return db
    .select()
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.category),
        isNull(transactions.supersededByTransactionId),
      ),
    );
}

export async function getTransactionsInRange(
  db: Db,
  userId: string,
  from: Date,
  to: Date,
) {
  return db
    .select()
    .from(transactions)
    .where(
      and(
        visibleTransactions(userId),
        isNotInternalTransfer,
        gte(transactions.date, from),
        lte(transactions.date, new Date(to.getTime() - 1)),
      ),
    );
}

export async function getFutureTransactions(db: Db, userId: string) {
  const now = new Date();
  return db
    .select()
    .from(transactions)
    .where(
      and(
        visibleTransactions(userId),
        isNotInternalTransfer,
        gt(transactions.date, now),
      ),
    )
    .orderBy(transactions.date);
}
