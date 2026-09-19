import { and, eq } from "drizzle-orm";

import type { getDb } from "./index";
import { categorizationRules } from "./schema";

type Db = ReturnType<typeof getDb>;

export interface CategorizationRule {
  id: string;
  userId: string;
  description: string;
  category: string;
  createdAt: Date;
}

export async function getRulesByUser(
  db: Db,
  userId: string,
): Promise<CategorizationRule[]> {
  return db
    .select()
    .from(categorizationRules)
    .where(eq(categorizationRules.userId, userId));
}

export async function getRuleForDescription(
  db: Db,
  userId: string,
  description: string,
): Promise<CategorizationRule | null> {
  const [row] = await db
    .select()
    .from(categorizationRules)
    .where(
      and(
        eq(categorizationRules.userId, userId),
        eq(categorizationRules.description, description),
      ),
    );
  return row ?? null;
}

export async function upsertCategorizationRule(
  db: Db,
  userId: string,
  description: string,
  category: string,
): Promise<CategorizationRule> {
  const [saved] = await db
    .insert(categorizationRules)
    .values({ userId, description, category })
    .onConflictDoUpdate({
      target: [categorizationRules.userId, categorizationRules.description],
      set: { category },
    })
    .returning();
  return saved;
}

export async function deleteRule(
  db: Db,
  userId: string,
  id: string,
): Promise<void> {
  await db
    .delete(categorizationRules)
    .where(
      and(
        eq(categorizationRules.userId, userId),
        eq(categorizationRules.id, id),
      ),
    );
}

export async function deleteRuleForDescription(
  db: Db,
  userId: string,
  description: string,
): Promise<void> {
  await db
    .delete(categorizationRules)
    .where(
      and(
        eq(categorizationRules.userId, userId),
        eq(categorizationRules.description, description),
      ),
    );
}

export async function renameCategoryOnRules(
  db: Db,
  userId: string,
  oldName: string,
  newName: string,
): Promise<void> {
  await db
    .update(categorizationRules)
    .set({ category: newName })
    .where(
      and(
        eq(categorizationRules.userId, userId),
        eq(categorizationRules.category, oldName),
      ),
    );
}
