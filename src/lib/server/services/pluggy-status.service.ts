import { PluggyStatus } from "$lib/enums/pluggy-status";
import type { getDb, Db } from "$lib/server/db";
import { getPluggyCredentials } from "$lib/server/db/pluggy-credentials";

export async function getPluggyStatus(
  db: Db,
  userId: string,
): Promise<PluggyStatus> {
  const creds = await getPluggyCredentials(db, userId);
  if (!creds) return PluggyStatus.Disconnected;
  if (creds.tokenExpiresAt && creds.tokenExpiresAt.getTime() <= Date.now()) {
    return PluggyStatus.Expired;
  }
  return PluggyStatus.Connected;
}
