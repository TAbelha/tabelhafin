import { and, eq, isNull } from "drizzle-orm";

import type { Db } from "./index";
import { tagRules, transactionTags, transactions } from "./schema";
import { getOrCreateTag } from "./tags";

export interface TagRule {
  id: string;
  description: string;
  tagName: string;
  createdAt: Date;
}

export async function getTagRulesByUser(
  db: Db,
  userId: string,
): Promise<TagRule[]> {
  return db
    .select({
      id: tagRules.id,
      description: tagRules.description,
      tagName: tagRules.tagName,
      createdAt: tagRules.createdAt,
    })
    .from(tagRules)
    .where(eq(tagRules.userId, userId));
}

export interface GroupedTagRule {
  description: string;
  tagNames: string[];
  createdAt: Date;
}

export async function getGroupedTagRulesByUser(
  db: Db,
  userId: string,
): Promise<GroupedTagRule[]> {
  const rows = await getTagRulesByUser(db, userId);

  const byDescription = new Map<string, GroupedTagRule>();
  for (const row of rows) {
    const entry = byDescription.get(row.description);
    if (!entry) {
      byDescription.set(row.description, {
        description: row.description,
        tagNames: [row.tagName],
        createdAt: row.createdAt,
      });
      continue;
    }
    entry.tagNames.push(row.tagName);
    if (row.createdAt < entry.createdAt) entry.createdAt = row.createdAt;
  }

  for (const entry of byDescription.values())
    entry.tagNames.sort((a, b) => a.localeCompare(b));
  return [...byDescription.values()].sort((a, b) =>
    a.description.localeCompare(b.description),
  );
}

export async function deleteTagRulesForDescription(
  db: Db,
  userId: string,
  description: string,
): Promise<void> {
  await db
    .delete(tagRules)
    .where(
      and(eq(tagRules.userId, userId), eq(tagRules.description, description)),
    );
}

export async function getTagRulesForDescription(
  db: Db,
  userId: string,
  description: string,
): Promise<string[]> {
  const rows = await db
    .select({ tagName: tagRules.tagName })
    .from(tagRules)
    .where(
      and(eq(tagRules.userId, userId), eq(tagRules.description, description)),
    );
  return rows.map((r) => r.tagName);
}

export async function setTagRulesForDescription(
  db: Db,
  userId: string,
  description: string,
  tagNames: string[],
): Promise<void> {
  const names = [...new Set(tagNames.map((n) => n.trim()).filter(Boolean))];
  await db
    .delete(tagRules)
    .where(
      and(eq(tagRules.userId, userId), eq(tagRules.description, description)),
    );
  if (names.length > 0) {
    await db
      .insert(tagRules)
      .values(names.map((tagName) => ({ userId, description, tagName })));
  }
}

export async function deleteTagRule(
  db: Db,
  userId: string,
  id: string,
): Promise<void> {
  await db
    .delete(tagRules)
    .where(and(eq(tagRules.id, id), eq(tagRules.userId, userId)));
}

export async function deleteTagRulesByTagName(
  db: Db,
  userId: string,
  tagName: string,
): Promise<void> {
  await db
    .delete(tagRules)
    .where(and(eq(tagRules.userId, userId), eq(tagRules.tagName, tagName)));
}

export async function applyTagRules(db: Db, userId: string): Promise<void> {
  const rules = await getTagRulesByUser(db, userId);
  if (rules.length === 0) return;

  const tagNames = [...new Set(rules.map((r) => r.tagName))];
  const tagIds = new Map<string, string>();
  for (const name of tagNames) {
    const tag = await getOrCreateTag(db, userId, name);
    tagIds.set(name, tag.id);
  }

  const rows = await db
    .select({ id: transactions.id, description: transactions.description })
    .from(transactions)
    .where(
      and(
        eq(transactions.userId, userId),
        isNull(transactions.supersededByTransactionId),
      ),
    );

  const txIdsByDescription = new Map<string, string[]>();
  for (const row of rows) {
    const list = txIdsByDescription.get(row.description) ?? [];
    list.push(row.id);
    txIdsByDescription.set(row.description, list);
  }

  for (const rule of rules) {
    const tagId = tagIds.get(rule.tagName);
    const txIds = txIdsByDescription.get(rule.description);
    if (!tagId || !txIds || txIds.length === 0) continue;
    await db
      .insert(transactionTags)
      .values(txIds.map((transactionId) => ({ transactionId, tagId })))
      .onConflictDoNothing();
  }
}
