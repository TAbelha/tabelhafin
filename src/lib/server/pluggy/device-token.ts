export function generateDeviceToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

export const DEVICE_TOKEN_KV_PREFIX = "pluggy_device:";
export const DEVICE_TOKEN_CURRENT_PREFIX = "pluggy_device_current:";
export const DEVICE_TOKEN_TTL_SECONDS = 60 * 60 * 24 * 90;

export async function issueDeviceToken(
  kv: KVNamespace,
  userId: string,
): Promise<string> {
  await revokeDeviceToken(kv, userId);

  const deviceToken = generateDeviceToken();
  await kv.put(`${DEVICE_TOKEN_KV_PREFIX}${deviceToken}`, userId, {
    expirationTtl: DEVICE_TOKEN_TTL_SECONDS,
  });
  await kv.put(`${DEVICE_TOKEN_CURRENT_PREFIX}${userId}`, deviceToken, {
    expirationTtl: DEVICE_TOKEN_TTL_SECONDS,
  });
  return deviceToken;
}

export async function revokeDeviceToken(
  kv: KVNamespace,
  userId: string,
): Promise<boolean> {
  const currentKey = `${DEVICE_TOKEN_CURRENT_PREFIX}${userId}`;
  const existing = await kv.get(currentKey);
  if (!existing) return false;

  await kv.delete(`${DEVICE_TOKEN_KV_PREFIX}${existing}`);
  await kv.delete(currentKey);
  return true;
}

export async function hasDeviceToken(
  kv: KVNamespace,
  userId: string,
): Promise<boolean> {
  return Boolean(await kv.get(`${DEVICE_TOKEN_CURRENT_PREFIX}${userId}`));
}
