import { requireAuth } from "$lib/server/api-auth";
import { getDb } from "$lib/server/db";
import { financeAccounts, transactions } from "$lib/server/db/schema";
import { exportUserData } from "$lib/server/db/user-data";

import { json } from "@sveltejs/kit";

import { eq } from "drizzle-orm";

import type { RequestHandler } from "./$types";

interface ExportRequest {
  format: "json" | "csv" | "xlsx";
  tables: string[];
}

export const POST: RequestHandler = async ({ locals, platform, request }) => {
  if (!locals.userId) requireAuth(locals.userId);

  const body = (await request.json()) as ExportRequest;
  const { format, tables } = body;

  if (!format || !Array.isArray(tables) || tables.length === 0) {
    return json({ error: "Parâmetros inválidos." }, { status: 400 });
  }

  const db = getDb(platform!.env.DB);
  const userId = locals.userId!;

  if (format === "json") {
    const allData = await exportUserData(db, userId);
    const filtered: Record<string, unknown> = {
      exportedAt: allData.exportedAt,
      format: allData.format,
    };

    if (tables.includes("transactions"))
      filtered.transactions = allData.transactions;
    if (tables.includes("accounts")) filtered.accounts = allData.accounts;
    if (tables.includes("categories")) filtered.categories = allData.categories;
    if (tables.includes("rules"))
      filtered.categorizationRules = allData.categorizationRules;
    if (tables.includes("tags")) filtered.tags = allData.tags;
    if (tables.includes("tagRules")) filtered.tagRules = allData.tagRules;
    if (tables.includes("recurring"))
      filtered.recurringExpenses = allData.recurringExpenses;
    if (tables.includes("reports"))
      filtered.monthlyReports = allData.monthlyReports;
    if (tables.includes("uploads"))
      filtered.statementUploads = allData.statementUploads;
    if (tables.includes("chat")) filtered.chat = allData.chat;
    if (tables.includes("prompts")) filtered.aiPrompts = allData.aiPrompts;

    const stamp = new Date().toISOString().slice(0, 10);
    return new Response(JSON.stringify(filtered, null, 2), {
      headers: {
        "content-type": "application/json; charset=utf-8",
        "content-disposition": `attachment; filename="tabelhafin-${stamp}.json"`,
        "cache-control": "no-store",
      },
    });
  }

  return json(
    { error: `Formato ${format} não implementado ainda.` },
    { status: 501 },
  );
};
