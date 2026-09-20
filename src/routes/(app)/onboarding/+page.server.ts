import { redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { savePluggyToken } from "$lib/server/pluggy/save-token";

import type { PageServerLoad, Actions } from "./$types";

export const load: PageServerLoad = async ({ locals }) => {
  if (!locals.userId) redirect(303, "/login");
};

export const actions: Actions = {
  complete: async ({ locals, platform }) => {
    if (!locals.userId) redirect(303, "/login");
    const db = getDb(platform!.env.DB);
    await db
      .update(users)
      .set({ seenOnboarding: true })
      .where(eq(users.id, locals.userId));
    redirect(303, "/dashboard");
  },

  connectPluggy: async ({ request, locals, platform }) => {
    if (!locals.userId) return { error: "Não autenticado." };

    const form = await request.formData();
    const token = form.get("token")?.toString().trim() ?? "";
    if (!token) return { error: "Token ausente." };

    const db = getDb(platform!.env.DB);

    let result;
    try {
      result = await savePluggyToken(
        db,
        platform!.env.MASTER_KEY,
        locals.userId,
        token,
      );
    } catch {
      return { error: "Token do Meu Pluggy inválido." };
    }

    return { ok: true, itemCount: result.itemCount };
  },
};
