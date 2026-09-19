import { generateMonthlyReports } from "$lib/server/reports/generate";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, platform }) => {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${platform!.env.CRON_SECRET}`) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  platform!.context.waitUntil(
    generateMonthlyReports(platform!.env).catch((err) => {
      console.error("[cron/report] failed", {
        error: err instanceof Error ? err.message : String(err),
      });
    }),
  );

  return json({ ok: true });
};
