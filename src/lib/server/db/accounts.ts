import { AccountType } from "$lib/enums/account-type";
import { and, eq } from "drizzle-orm";

import type { getDb } from "./index";
import { financeAccounts as accounts, pluggyItems } from "./schema";

type Db = ReturnType<typeof getDb>;

export interface AccountInput {
  userId: string;
  pluggyItemId: string;
  pluggyAccountId: string;
  institution: string;
  type: AccountType;
  name: string;
  currency: string;
  cachedBalance: number;
}

export async function getAccountsByUser(db: Db, userId: string) {
  return db.select().from(accounts).where(eq(accounts.userId, userId));
}

const MANUAL_INSTITUTION = "Manual";

async function ensureManualItem(db: Db, userId: string): Promise<string> {
  const pluggyItemId = `manual:${userId}`;
  const [existing] = await db
    .select()
    .from(pluggyItems)
    .where(eq(pluggyItems.pluggyItemId, pluggyItemId));
  if (existing) return existing.id;

  const [created] = await db
    .insert(pluggyItems)
    .values({
      userId,
      pluggyItemId,
      institutionName: MANUAL_INSTITUTION,
      institutionType: "MANUAL",
      status: "MANUAL",
    })
    .returning();
  return created.id;
}

export interface ManualAccountInput {
  userId: string;
  name: string;
  type: AccountType;
  balance: number;
}

export async function createManualAccount(db: Db, input: ManualAccountInput) {
  const itemId = await ensureManualItem(db, input.userId);
  const [created] = await db
    .insert(accounts)
    .values({
      userId: input.userId,
      pluggyItemId: itemId,
      pluggyAccountId: `manual:${crypto.randomUUID()}`,
      institution: MANUAL_INSTITUTION,
      type: input.type,
      name: input.name,
      currency: "BRL",
      cachedBalance: input.balance,
    })
    .returning();
  return created;
}

export async function updateAccountBalance(
  db: Db,
  userId: string,
  accountId: string,
  balance: number,
) {
  await db
    .update(accounts)
    .set({ cachedBalance: balance })
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));
}

export async function deleteAccount(db: Db, userId: string, accountId: string) {
  await db
    .delete(accounts)
    .where(and(eq(accounts.id, accountId), eq(accounts.userId, userId)));
}

export function isManualAccount(account: { pluggyAccountId: string }): boolean {
  return account.pluggyAccountId.startsWith("manual:");
}

export async function upsertAccount(db: Db, input: AccountInput) {
  const [saved] = await db
    .insert(accounts)
    .values(input)
    .onConflictDoUpdate({
      target: accounts.pluggyAccountId,
      set: {
        institution: input.institution,
        type: input.type,
        name: input.name,
        currency: input.currency,
        cachedBalance: input.cachedBalance,
      },
    })
    .returning();
  return saved;
}
