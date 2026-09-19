import { encryptSecret } from "$lib/server/crypto";
import { getDb } from "$lib/server/db";
import { upsertPluggyCredentials } from "$lib/server/db/pluggy-credentials";
import { fetchItems, jwtExpiresAt } from "$lib/server/pluggy/client";
import { DEVICE_TOKEN_KV_PREFIX } from "$lib/server/pluggy/device-token";
import { syncUserItems } from "$lib/server/pluggy/sync";

import { json } from "@sveltejs/kit";

import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, platform }) => {
  const auth = request.headers.get("authorization") ?? "";
  const deviceToken = auth.replace(/^Bearer\s+/i, "").trim();
  if (!deviceToken)
    return json({ error: "Device token ausente." }, { status: 401 });

  const userId = await platform!.env.SESSIONS.get(
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

  let items;
  try {
    items = await fetchItems(token);
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

  const expiresAt = jwtExpiresAt(token);
  const { ciphertext, nonce } = await encryptSecret(
    platform!.env.MASTER_KEY,
    token,
    {
      purpose: "pluggy_credentials",
      userId,
    },
  );

  await upsertPluggyCredentials(db, {
    userId,
    tokenEncrypted: ciphertext,
    tokenNonce: nonce,
    tokenExpiresAt: expiresAt ? new Date(expiresAt) : null,
  });

  platform!.context.waitUntil(
    syncUserItems(db, platform!.env.MASTER_KEY, userId).catch((err) => {
      console.error("[pluggy/token] sync after token push failed", {
        userId,
        error: err instanceof Error ? err.message : String(err),
      });
    }),
  );

  return json({ success: true, itemCount: items.length });
};
