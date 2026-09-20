import { encryptSecret } from "$lib/server/crypto";
import { getDb, type Db } from "$lib/server/db";
import { upsertPluggyCredentials } from "$lib/server/db/pluggy-credentials";
import { fetchItems, jwtExpiresAt } from "$lib/server/pluggy/client";
import { syncUserItems } from "$lib/server/pluggy/sync";

interface SavePluggyTokenResult {
  itemCount: number;
}

export async function savePluggyToken(
  db: Db,
  masterKey: string,
  userId: string,
  token: string,
): Promise<SavePluggyTokenResult> {
  const items = await fetchItems(token);

  const expiresAt = jwtExpiresAt(token);
  const { ciphertext, nonce } = await encryptSecret(masterKey, token, {
    purpose: "pluggy_credentials",
    userId,
  });

  await upsertPluggyCredentials(db, {
    userId,
    tokenEncrypted: ciphertext,
    tokenNonce: nonce,
    tokenExpiresAt: expiresAt ? new Date(expiresAt) : null,
  });

  syncUserItems(db, masterKey, userId).catch((err) => {
    console.error("[pluggy] sync after token save failed", {
      userId,
      error: err instanceof Error ? err.message : String(err),
    });
  });

  return { itemCount: items.length };
}
