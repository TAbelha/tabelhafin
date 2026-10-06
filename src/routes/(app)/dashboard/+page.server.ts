import { AccountType } from "$lib/enums/account-type";
import { getDb } from "$lib/server/db";
import { getAccountsByUser } from "$lib/server/db/accounts";
import { getTagTotals } from "$lib/server/db/tags";
import {
  getTransactionsInRange,
  summarizeTransactions,
} from "$lib/server/db/transactions";
import { requireLogin } from "$lib/server/require-login";

export const load = async ({
  locals,
  platform,
}: {
  locals: App.Locals;
  platform: App.Platform;
}) => {
  requireLogin(locals.userId);

  const db = getDb(platform.env.DB);
  const now = new Date();
  const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const to = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

  const [accounts, tagTotals] = await Promise.all([
    getAccountsByUser(db, locals.userId),
    getTagTotals(db, locals.userId, from, to),
  ]);

  // Single 12-month query covers everything
  const twelveMonthsAgo = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 11, 1));
  const allTx = await getTransactionsInRange(db, locals.userId, twelveMonthsAgo, to);

  // Current month's transactions for summary
  const txRows = allTx.filter((tx) => {
    const d = new Date(tx.date);
    return d.getUTCFullYear() === from.getUTCFullYear() && d.getUTCMonth() === from.getUTCMonth();
  });

  // Monthly expenses grouped with Map (no repeated Date construction)
  const expenseByMonth = new Map<string, number>();
  for (const tx of allTx) {
    if (tx.amount >= 0) continue;
    const key = tx.date.toISOString().slice(0, 7); // "YYYY-MM"
    expenseByMonth.set(key, (expenseByMonth.get(key) ?? 0) + Math.abs(tx.amount));
  }

  const monthlyExpenses: { month: string; amount: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
    const monthLabel = d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
    const key = d.toISOString().slice(0, 7);
    monthlyExpenses.push({ month: monthLabel, amount: expenseByMonth.get(key) ?? 0 });
  }

  const accountTypeById = new Map(
    accounts.map((a) => [a.id, a.type as AccountType]),
  );
  const {
    income: monthIncome,
    expense: monthExpense,
    categoryTotals,
  } = summarizeTransactions(txRows, accountTypeById);
  const investmentBalance = accounts
    .filter((a) => a.type === AccountType.Investment)
    .reduce((sum, a) => sum + a.cachedBalance, 0);

  const categoryList = Object.entries(categoryTotals)
    .map(([name, expense]) => ({ name, expense }))
    .sort((a, b) => b.expense - a.expense);

  return {
    accounts,
    monthIncome,
    monthExpense,
    investmentBalance,
    categoryTotals: categoryList,
    monthlyExpenses,
  };
};
