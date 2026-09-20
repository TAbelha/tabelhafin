import { eq } from "drizzle-orm";

import type { getDb, Db } from "./index";
import { aiCredentials } from "./schema";


export interface AiCredentialsInput {
  userId: string;
  provider: string;
  model: string;
  keyEncrypted: string;
  nonce: string;
  v?: number;
}

export async function getAiCredentials(db: Db, userId: string) {
  const [row] = await db
    .select()
    .from(aiCredentials)
    .where(eq(aiCredentials.userId, userId));
  return row ?? null;
}

export async function upsertAiCredentials(db: Db, input: AiCredentialsInput) {
  const [saved] = await db
    .insert(aiCredentials)
    .values({
      userId: input.userId,
      provider: input.provider,
      model: input.model,
      keyEncrypted: input.keyEncrypted,
      nonce: input.nonce,
      v: input.v,
    })
    .onConflictDoUpdate({
      target: aiCredentials.userId,
      set: {
        provider: input.provider,
        model: input.model,
        keyEncrypted: input.keyEncrypted,
        nonce: input.nonce,
        v: input.v,
      },
    })
    .returning();
  return saved;
}
