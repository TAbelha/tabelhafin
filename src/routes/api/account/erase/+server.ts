import { getDb } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { requireAuth } from "$lib/server/api-auth";
import { eq } from "drizzle-orm";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals, platform }) => {
  requireAuth(locals.userId);

  const db = getDb(platform!.env.DB);
  const deletedId = locals.userId!;

  await db
    .update(users)
    .set({
      name: "Usuário excluído",
      email: `deleted-${deletedId}@tabelhafin.local`,
      emailVerified: false,
      image: null,
      timezone: "UTC",
      defaultCurrency: "BRL",
      hideAi: true,
      aiCategorizationEnabled: false,
      aiReportEnabled: false,
      aiChatEnabled: false,
    })
    .where(eq(users.id, deletedId));

  return json({ ok: true });
};
