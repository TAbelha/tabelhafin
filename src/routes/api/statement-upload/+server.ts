import { requireAuth } from "$lib/server/api-auth";
import { errorJson } from "$lib/server/api-helpers";
import { getDb } from "$lib/server/db";
import {
  createStatementReview,
  type StatementSource,
} from "$lib/server/db/statement-reviews";

import { json } from "@sveltejs/kit";

import type { RequestHandler } from "./$types";

const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const VALID_SOURCES = new Set(["csv", "ofx", "pdf"]);

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  requireAuth(locals.userId);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return errorJson("Nenhum arquivo enviado.");

  if (file.size > MAX_SIZE) {
    return errorJson("Arquivo muito grande. Limite: 10 MB.");
  }

  const source = String(formData.get("source") ?? "csv");
  if (!VALID_SOURCES.has(source)) {
    return errorJson(`Fonte inválida: ${source}. Use: csv, ofx, pdf.`);
  }

  const db = getDb(platform!.env.DB);
  const review = await createStatementReview(db, {
    userId: locals.userId!,
    source: source as StatementSource,
    filename: file.name,
  });

  return json({ reviewId: review.id, status: "pending" });
};
