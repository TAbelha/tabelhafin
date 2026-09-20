import { eq, inArray } from "drizzle-orm";

import type { getDb, Db } from "./index";
import {
  categorizationRules,
  chatConversations,
  chatMessages,
  financeAccounts,
  monthlyReports,
  recurringExpenses,
  statementUploads,
  tagRules,
  tags,
  transactions,
  userAiPrompts,
  userCategories,
  users,
} from "./schema";


export async function exportUserData(db: Db, userId: string) {
  const [
    user,
    accounts,
    txs,
    categories,
    rules,
    userTags,
    tagRuleRows,
    recurring,
    reports,
    uploads,
    conversations,
    prompts,
  ] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)),
    db.select().from(financeAccounts).where(eq(financeAccounts.userId, userId)),
    db.select().from(transactions).where(eq(transactions.userId, userId)),
    db.select().from(userCategories).where(eq(userCategories.userId, userId)),
    db
      .select()
      .from(categorizationRules)
      .where(eq(categorizationRules.userId, userId)),
    db.select().from(tags).where(eq(tags.userId, userId)),
    db.select().from(tagRules).where(eq(tagRules.userId, userId)),
    db
      .select()
      .from(recurringExpenses)
      .where(eq(recurringExpenses.userId, userId)),
    db.select().from(monthlyReports).where(eq(monthlyReports.userId, userId)),
    db
      .select()
      .from(statementUploads)
      .where(eq(statementUploads.userId, userId)),
    db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId)),
    db.select().from(userAiPrompts).where(eq(userAiPrompts.userId, userId)),
  ]);

  const conversationIds = conversations.map((c) => c.id);
  const messages =
    conversationIds.length > 0
      ? await db
          .select()
          .from(chatMessages)
          .where(inArray(chatMessages.conversationId, conversationIds))
      : [];

  const profile = user[0];

  return {
    exportedAt: new Date().toISOString(),
    format: "tabelhafin-export-v1",
    profile: profile
      ? {
          id: profile.id,
          name: profile.name,
          email: profile.email,
          createdAt: profile.createdAt,
        }
      : null,
    accounts,
    transactions: txs,
    categories,
    categorizationRules: rules,
    tags: userTags,
    tagRules: tagRuleRows,
    recurringExpenses: recurring,
    monthlyReports: reports,
    statementUploads: uploads,
    chat: { conversations, messages },
    aiPrompts: prompts,
  };
}

export async function deleteUserAccount(db: Db, userId: string): Promise<void> {
  await db.delete(users).where(eq(users.id, userId));
}
