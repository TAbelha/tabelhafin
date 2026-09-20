import { getDb } from "$lib/server/db";
import {
  createRecurringExpense,
  deleteRecurringExpense,
  getRecurringExpenses,
} from "$lib/server/db/recurring-expenses";
import { requireLogin } from "$lib/server/require-login";

import { fail } from "@sveltejs/kit";
import { toast } from "svelte-sonner";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, platform }) => {
  requireLogin(locals.userId);

  const db = getDb(platform!.env.DB);
  const expenses = await getRecurringExpenses(db, locals.userId);

  return { expenses };
};

export const actions: Actions = {
  create: async ({ request, locals, platform }) => {
    requireLogin(locals.userId);

    const form = await request.formData();
    const description = String(form.get("description") ?? "").trim();
    const amountRaw = String(form.get("amount") ?? "").trim();
    const frequency = String(form.get("frequency") ?? "monthly");
    const nextChargeDate = String(form.get("nextChargeDate") ?? "");

    if (!description) return fail(400, { error: "Descrição obrigatória." });
    if (!amountRaw) return fail(400, { error: "Valor obrigatório." });

    const amount = Math.round(parseFloat(amountRaw) * 100);
    if (!Number.isFinite(amount))
      return fail(400, { error: "Valor inválido." });

    const [year, month, day] = nextChargeDate.split("-").map(Number);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (!Number.isFinite(date.getTime()))
      return fail(400, { error: "Data inválida." });

    const db = getDb(platform!.env.DB);
    await createRecurringExpense(db, locals.userId!, {
      description,
      amount,
      frequency: frequency as any,
      nextChargeDate: date,
    });

    toast.success("Recorrência criada.");
    return { success: true };
  },

  delete: async ({ request, locals, platform }) => {
    requireLogin(locals.userId);

    const form = await request.formData();
    const expenseId = String(form.get("expenseId") ?? "");
    if (!expenseId) return fail(400, { error: "ID inválido." });

    const db = getDb(platform!.env.DB);
    await deleteRecurringExpense(db, locals.userId, expenseId);

    toast.success("Recorrência excluída.");
    return { success: true };
  },
};
