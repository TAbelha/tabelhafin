import { getDb } from "$lib/server/db";
import { getAccountsByUser } from "$lib/server/db/accounts";
import { insertManualTransaction } from "$lib/server/db/transactions";
import { requireLogin } from "$lib/server/require-login";

import { BRL } from "$lib/enums/currency";

import { fail, redirect } from "@sveltejs/kit";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, platform }) => {
  requireLogin(locals.userId);

  const db = getDb(platform!.env.DB);
  const accounts = await getAccountsByUser(db, locals.userId);

  return { accounts };
};

export const actions: Actions = {
  create: async ({ request, locals, platform }) => {
    requireLogin(locals.userId);

    const form = await request.formData();
    const description = String(form.get("description") ?? "").trim();
    const amountRaw = String(form.get("amount") ?? "").trim();
    const dateRaw = String(form.get("date") ?? "").trim();
    const category = String(form.get("category") ?? "Outros");
    const accountId = String(form.get("accountId") ?? "") || null;
    const notes = String(form.get("notes") ?? "").trim() || null;

    if (!description) return fail(400, { error: "Descrição obrigatória" });
    if (!amountRaw) return fail(400, { error: "Valor obrigatório" });

    const amount = Math.round(parseFloat(amountRaw) * 100);
    if (!Number.isFinite(amount)) return fail(400, { error: "Valor inválido" });

    const [year, month, day] = dateRaw.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (!Number.isFinite(date.getTime()))
      return fail(400, { error: "Data inválida." });

    const db = getDb(platform!.env.DB);
    await insertManualTransaction(db, {
      userId: locals.userId,
      accountId,
      date,
      description,
      amount,
      currency: BRL,
      category,
      notes,
    });

    throw redirect(303, "/transactions");
  },
};
