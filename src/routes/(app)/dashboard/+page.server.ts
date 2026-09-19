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

  const [accounts, txRows, tagTotals] = await Promise.all([
    getAccountsByUser(db, locals.userId),
    getTransactionsInRange(db, locals.userId, from, to),
    getTagTotals(db, locals.userId, from, to),
  ]);

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
  };
};
