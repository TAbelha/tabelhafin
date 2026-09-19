import { getDb } from "$lib/server/db";
import { getAccountsByUser } from "$lib/server/db/accounts";
import { getTransactionsByUser } from "$lib/server/db/transactions";
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
  const [accounts, txRows] = await Promise.all([
    getAccountsByUser(db, locals.userId),
    getTransactionsByUser(db, locals.userId),
  ]);

  const accountById = new Map(accounts.map((a) => [a.id, a]));

  const transactions = txRows
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .map((tx) => ({
      id: tx.id,
      description: tx.description,
      amount: tx.amount,
      date: tx.date,
      category: tx.category,
      accountName: tx.accountId
        ? (accountById.get(tx.accountId)?.name ?? null)
        : null,
    }));

  return { transactions };
};
