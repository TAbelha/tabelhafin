import { getDb } from "$lib/server/db";
import { DEVICE_TOKEN_KV_PREFIX } from "$lib/server/pluggy/device-token";
import { savePluggyToken } from "$lib/server/pluggy/save-token";

import { json } from "@sveltejs/kit";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, platform }) => {
  const auth = request.headers.get("authorization") ?? "";
  const deviceToken = auth.replace(/^Bearer\s+/i, "").trim();
  if (!deviceToken)
    return json({ error: "Device token ausente." }, { status: 401 });

  const userId = await platform!.env.DEVICE_TOKENS.get(
    `${DEVICE_TOKEN_KV_PREFIX}${deviceToken}`,
  );
  if (!userId)
    return json({ error: "Código de pareamento inválido." }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    token?: unknown;
  } | null;
  const token = typeof body?.token === "string" ? body.token.trim() : "";
  if (!token)
    return json({ error: "Token do Meu Pluggy ausente." }, { status: 400 });

  const db = getDb(platform!.env.DB);

  let result;
  try {
    result = await savePluggyToken(db, platform!.env.MASTER_KEY, userId, token);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (/401|Unauthorized/.test(msg)) {
      return json(
        { error: "Token do Meu Pluggy inválido ou expirado." },
        { status: 400 },
      );
    }
    return json(
      { error: "Não foi possível validar o token." },
      { status: 502 },
    );
  }

  return json({ ok: true, itemCount: result.itemCount });
};
