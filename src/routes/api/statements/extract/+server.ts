import { requireAuth } from "$lib/server/api-auth";
import { getDb } from "$lib/server/db";
import {
  createStatementReview,
  updateStatementReviewStatus,
  StatementReviewStatus,
} from "$lib/server/db/statement-reviews";

import { json } from "@sveltejs/kit";

import type { RequestHandler } from "./$types";

interface ExtractPayload {
  source: string;
  filename: string;
  transactions: unknown[];
}

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  if (!locals.userId) requireAuth(locals.userId);

  const body = (await request
    .json()
    .catch(() => null)) as ExtractPayload | null;
  if (!body?.filename || !Array.isArray(body.transactions)) {
    return json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const db = getDb(platform!.env.DB);
  const review = await createStatementReview(db, {
    userId: locals.userId!,
    source: body.source as any,
    filename: body.filename,
  });

  await updateStatementReviewStatus(
    db,
    review.id,
    StatementReviewStatus.Ready,
    {
      extractedJson: JSON.stringify(body.transactions),
      transactionCount: body.transactions.length,
      duplicateCount: 0,
    },
  );

  return json({ reviewId: review.id, status: "ready" });
};
