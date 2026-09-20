import { eq } from "drizzle-orm";

import type { getDb } from "./index";
import { pushSubscriptions } from "./schema";

type Db = ReturnType<typeof getDb>;

export interface PushSubscriptionInput {
  userId: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export async function upsertPushSubscription(
  db: Db,
  input: PushSubscriptionInput,
) {
  const [saved] = await db
    .insert(pushSubscriptions)
    .values(input)
    .onConflictDoUpdate({
      target: pushSubscriptions.endpoint,
      set: { userId: input.userId, p256dh: input.p256dh, auth: input.auth },
    })
    .returning();
  return saved;
}
