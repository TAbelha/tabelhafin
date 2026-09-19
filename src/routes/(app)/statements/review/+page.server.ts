import { getDb } from "$lib/server/db";
import {
  getStatementReviewById,
  getStatementReviewsByUser,
} from "$lib/server/db/statement-reviews";
import { requireLogin } from "$lib/server/require-login";

import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, platform, url }) => {
  requireLogin(locals.userId);

  const db = getDb(platform!.env.DB);
  const reviewId = url.searchParams.get("id");

  if (reviewId) {
    const review = await getStatementReviewById(db, reviewId, locals.userId!);
    if (review) {
      return {
        review,
        transactions: review.extractedJson
          ? JSON.parse(review.extractedJson)
          : [],
      };
    }
  }

  const reviews = await getStatementReviewsByUser(db, locals.userId!);
  const pending = reviews.find((r) => r.status === "ready");

  return {
    review: pending ?? null,
    transactions: pending?.extractedJson
      ? JSON.parse(pending.extractedJson)
      : [],
  };
};
