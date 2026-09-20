import { requireAuth } from "$lib/server/api-auth";
import { getDb } from "$lib/server/db";
import { getLatestMonthlyReport } from "$lib/server/db/monthly-reports";

import { json } from "@sveltejs/kit";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ locals, platform }) => {
  requireAuth(locals.userId);

  const db = getDb(platform!.env.DB);
  const report = await getLatestMonthlyReport(db, locals.userId);

  if (!report) {
    return json(null, { status: 404 });
  }

  return json({
    yearMonth: report.yearMonth,
    summary: JSON.parse(report.summaryJson),
    generatedAt: report.generatedAt.toISOString(),
  });
};
