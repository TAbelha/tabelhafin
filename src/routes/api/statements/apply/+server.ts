import { requireAuth } from "$lib/server/api-auth";
import { getDb } from "$lib/server/db";
import { insertManualTransaction } from "$lib/server/db/transactions";
import {
  saveApprovedTransactions,
  updateStatementReviewStatus,
  StatementReviewStatus,
} from "$lib/server/db/statement-reviews";

import { json } from "@sveltejs/kit";

import type { RequestHandler } from "./$types";

interface ApplyPayload {
  reviewId: string;
  transactions: {
    date: string;
    description: string;
    amount: number;
    category?: string;
  }[];
}

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  requireAuth(locals.userId);

  const body = (await request.json().catch(() => null)) as ApplyPayload | null;
  if (!body?.reviewId || !Array.isArray(body.transactions)) {
    return json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const db = getDb(platform!.env.DB);

  const approvedTransactions = [];
  for (const tx of body.transactions) {
    const [year, month, day] = tx.date.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));

    await insertManualTransaction(db, {
      userId: locals.userId!,
      date,
      description: tx.description,
      amount: tx.amount,
      currency: "BRL",
      category: null,
    });
    approvedTransactions.push(tx);
  }

  await saveApprovedTransactions(
    db,
    body.reviewId,
    JSON.stringify(approvedTransactions),
  );
  await updateStatementReviewStatus(
    db,
    body.reviewId,
    StatementReviewStatus.Applied,
  );

  return json({ success: true, count: body.transactions.length });
};
