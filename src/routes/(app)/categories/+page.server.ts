import { AccountType } from "$lib/enums/account-type";
import { getDb } from "$lib/server/db";
import { getAccountsByUser } from "$lib/server/db/accounts";
import { transactions } from "$lib/server/db/schema";
import {
  classifyMovement,
  isNotInternalTransfer,
  visibleTransactions,
} from "$lib/server/db/transactions";
import { getCategoriesByUser } from "$lib/server/db/user-categories";
import { requireLogin } from "$lib/server/require-login";

import { and } from "drizzle-orm";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, platform }) => {
  requireLogin(locals.userId);

  const db = getDb(platform!.env.DB);
  const userId = locals.userId;

  const userCategories = await getCategoriesByUser(db, userId);
  const userAccounts = await getAccountsByUser(db, userId);
  const accountTypeById = new Map(
    userAccounts.map((a) => [a.id, a.type as AccountType]),
  );

  const rows = await db
    .select({
      category: transactions.category,
      amount: transactions.amount,
      accountId: transactions.accountId,
    })
    .from(transactions)
    .where(and(visibleTransactions(userId), isNotInternalTransfer));

  const expenses: Record<string, number> = {};
  const income: Record<string, number> = {};
  for (const r of rows) {
    const cat = r.category ?? "Outros";
    const { expense, income: inc } = classifyMovement(
      r.accountId ? accountTypeById.get(r.accountId) : undefined,
      r.amount,
    );
    expenses[cat] = (expenses[cat] ?? 0) + expense;
    income[cat] = (income[cat] ?? 0) + inc;
  }

  const categories = userCategories
    .map((c) => ({
      name: c.name,
      color: c.color,
      expense: expenses[c.name] ?? 0,
      income: income[c.name] ?? 0,
    }))
    .sort(
      (a, b) => Math.max(b.expense, b.income) - Math.max(a.expense, a.income),
    );

  if (!userCategories.some((c) => c.name === "Outros")) {
    categories.push({
      name: "Outros",
      color: "#94a3b8",
      expense: expenses["Outros"] ?? 0,
      income: income["Outros"] ?? 0,
    });
  }

  return { categories };
};
