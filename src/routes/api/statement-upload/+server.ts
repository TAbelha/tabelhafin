import { requireAuth } from "$lib/server/api-auth";
import { getDb } from "$lib/server/db";
import {
  createStatementReview,
  StatementSource,
  StatementReviewStatus,
} from "$lib/server/db/statement-reviews";

import { json } from "@sveltejs/kit";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  if (!locals.userId) requireAuth(locals.userId);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) {
    return json({ error: "Nenhum arquivo enviado." }, { status: 400 });
  }

  const source = String(formData.get("source") ?? "csv") as StatementSource;

  const db = getDb(platform!.env.DB);
  const review = await createStatementReview(db, {
    userId: locals.userId!,
    source,
    filename: file.name,
  });

  return json({ reviewId: review.id, status: "pending" });
};
