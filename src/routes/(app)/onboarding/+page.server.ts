import { redirect } from "@sveltejs/kit";
import { getDb } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { eq } from "drizzle-orm";
import { encryptSecret } from "$lib/server/crypto";
import { upsertPluggyCredentials } from "$lib/server/db/pluggy-credentials";
import { fetchItems, jwtExpiresAt } from "$lib/server/pluggy/client";
import { syncUserItems } from "$lib/server/pluggy/sync";

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

    let items;
    try {
      items = await fetchItems(token);
    } catch {
      return { error: "Token do Meu Pluggy inválido." };
    }

    const db = getDb(platform!.env.DB);
    const expiresAt = jwtExpiresAt(token);
    const { ciphertext, nonce } = await encryptSecret(
      platform!.env.MASTER_KEY,
      token,
      { purpose: "pluggy_credentials", userId: locals.userId },
    );

    await upsertPluggyCredentials(db, {
      userId: locals.userId,
      tokenEncrypted: ciphertext,
      tokenNonce: nonce,
      tokenExpiresAt: expiresAt ? new Date(expiresAt) : null,
    });

    platform!.context.waitUntil(
      syncUserItems(db, platform!.env.MASTER_KEY, locals.userId).catch(() => {}),
    );

    return { success: true, itemCount: items.length };
  },
};
