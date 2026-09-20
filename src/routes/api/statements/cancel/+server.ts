import { requireAuth } from "$lib/server/api-auth";
import { getDb } from "$lib/server/db";
import {
  updateStatementReviewStatus,
  StatementReviewStatus,
} from "$lib/server/db/statement-reviews";

import { json } from "@sveltejs/kit";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  requireAuth(locals.userId);

  const body = (await request.json().catch(() => null)) as {
    reviewId?: string;
  } | null;
  if (!body?.reviewId) {
    return json({ error: "reviewId obrigatório." }, { status: 400 });
  }

  const db = getDb(platform!.env.DB);
  await updateStatementReviewStatus(
    db,
    body.reviewId,
    StatementReviewStatus.Cancelled,
  );

  return json({ success: true });
};
