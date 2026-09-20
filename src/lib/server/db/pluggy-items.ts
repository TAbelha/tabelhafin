import { and, eq, notLike } from "drizzle-orm";

import type { Db } from "./index";
import { pluggyItems } from "./schema";

export interface PluggyItemInput {
  userId: string;
  pluggyItemId: string;
  institutionName: string;
  institutionType: string;
  status: string;
}

const REAL_ITEMS_ONLY = notLike(pluggyItems.pluggyItemId, "manual:%");

export async function getAllPluggyItems(db: Db) {
  return db.select().from(pluggyItems).where(REAL_ITEMS_ONLY);
}

export async function getPluggyItemsByUser(db: Db, userId: string) {
  return db
    .select()
    .from(pluggyItems)
    .where(and(eq(pluggyItems.userId, userId), REAL_ITEMS_ONLY));
}

export async function upsertPluggyItem(db: Db, input: PluggyItemInput) {
  const [saved] = await db
    .insert(pluggyItems)
    .values(input)
    .onConflictDoUpdate({
      target: pluggyItems.pluggyItemId,
      set: {
        institutionName: input.institutionName,
        institutionType: input.institutionType,
        status: input.status,
      },
    })
    .returning();
  return saved;
}

export async function updateLastSyncedAt(
  db: Db,
  id: string,
  lastSyncedAt: Date,
) {
  await db
    .update(pluggyItems)
    .set({ lastSyncedAt })
    .where(eq(pluggyItems.id, id));
}

export async function updateLastSyncAttemptAt(
  db: Db,
  id: string,
  lastSyncAttemptAt: Date,
) {
  await db
    .update(pluggyItems)
    .set({ lastSyncAttemptAt })
    .where(eq(pluggyItems.id, id));
}

export const SYNC_COOLDOWN_MS = 15 * 60 * 1000;

type SyncCooldownItem = {
  lastSyncedAt: Date | null;
  lastSyncAttemptAt: Date | null;
};

function attemptedWithinCooldown(item: SyncCooldownItem, now: Date): boolean {
  if (!item.lastSyncAttemptAt) return false;
  return now.getTime() - item.lastSyncAttemptAt.getTime() < SYNC_COOLDOWN_MS;
}

export function shouldRecoverySync(
  items: SyncCooldownItem[],
  now = new Date(),
): boolean {
  return items.some(
    (item) => !item.lastSyncedAt && !attemptedWithinCooldown(item, now),
  );
}

export function shouldRefreshSync(
  items: SyncCooldownItem[],
  now = new Date(),
): boolean {
  if (items.length === 0) return false;
  return items.some((item) => !attemptedWithinCooldown(item, now));
}
