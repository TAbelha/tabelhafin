import { AccountType } from "$lib/enums/account-type";
import { getDb } from "$lib/server/db";
import {
  createManualAccount,
  deleteAccount,
  getAccountsByUser,
  isManualAccount,
  updateAccountBalance,
} from "$lib/server/db/accounts";
import { requireLogin } from "$lib/server/require-login";
import { signedBalance, sumSignedBalance } from "$lib/utils/accounts";
import { parseCents } from "$lib/utils/money";

import { fail } from "@sveltejs/kit";
import { toast } from "svelte-sonner";

import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals, platform }) => {
  requireLogin(locals.userId);

  const db = getDb(platform!.env.DB);
  const userAccounts = await getAccountsByUser(db, locals.userId);

  const checking = userAccounts
    .filter((a) => a.type === AccountType.Checking)
    .reduce((sum, a) => sum + a.cachedBalance, 0);
  const investment = userAccounts
    .filter((a) => a.type === AccountType.Investment)
    .reduce((sum, a) => sum + a.cachedBalance, 0);
  const credit = userAccounts
    .filter((a) => a.type === AccountType.CreditCard)
    .reduce((sum, a) => sum + a.cachedBalance, 0);

  return {
    accounts: [...userAccounts]
      .sort((a, b) => signedBalance(b) - signedBalance(a))
      .map((a) => ({ ...a, manual: isManualAccount(a) })),
    summary: {
      total: sumSignedBalance(userAccounts),
      checking,
      investment,
      credit,
    },
  };
};

const ACCOUNT_TYPES = Object.values(AccountType);

export const actions: Actions = {
  create: async ({ request, locals, platform }) => {
    requireLogin(locals.userId);

    const form = await request.formData();
    const name = String(form.get("name") ?? "").trim();
    const type = String(form.get("type") ?? "");
    const balance = parseCents(form.get("balance"));

    if (!name) return fail(400, { error: "Dê um nome pra conta." });
    if (!ACCOUNT_TYPES.includes(type as AccountType))
      return fail(400, { error: "Escolha um tipo de conta." });
    if (balance === null)
      return fail(400, { error: "Informe um saldo válido." });

    const db = getDb(platform!.env.DB);
    await createManualAccount(db, {
      userId: locals.userId,
      name,
      type: type as AccountType,
      balance,
    });
    toast.success(`Conta "${name}" criada.`);
    return { success: true };
  },

  updateBalance: async ({ request, locals, platform }) => {
    requireLogin(locals.userId);

    const form = await request.formData();
    const accountId = String(form.get("accountId") ?? "");
    const balance = parseCents(form.get("balance"));
    if (!accountId) return fail(400, { error: "Conta inválida." });
    if (balance === null)
      return fail(400, { error: "Informe um saldo válido." });

    const db = getDb(platform!.env.DB);
    await updateAccountBalance(db, locals.userId, accountId, balance);
    toast.success("Saldo atualizado.");
    return { success: true };
  },

  delete: async ({ request, locals, platform }) => {
    requireLogin(locals.userId);

    const form = await request.formData();
    const accountId = String(form.get("accountId") ?? "");
    if (!accountId) return fail(400, { error: "Conta inválida." });

    const db = getDb(platform!.env.DB);
    await deleteAccount(db, locals.userId, accountId);
    toast.success("Conta excluída.");
    return { success: true };
  },
};
