import { cronHandler } from "$lib/server/cron-handler";
import { generateMonthlyReports } from "$lib/server/reports/generate";

export const POST = cronHandler((env) => generateMonthlyReports(env), "report");
