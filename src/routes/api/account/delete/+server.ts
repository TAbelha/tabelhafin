import { getDb } from "$lib/server/db";
import { users } from "$lib/server/db/schema";
import { requireAuth } from "$lib/server/api-auth";
import { eq } from "drizzle-orm";
import { json } from "@sveltejs/kit";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ locals, platform }) => {
  requireAuth(locals.userId);

  const db = getDb(platform!.env.DB);
  await db.delete(users).where(eq(users.id, locals.userId!));

  return json({ ok: true });
};
