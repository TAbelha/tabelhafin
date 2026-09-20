import { and, eq } from "drizzle-orm";

import type { Db } from "./index";
import { statementUploads } from "./schema";

export async function getCompletedUploadFilenames(
  db: Db,
  userId: string,
): Promise<string[]> {
  const rows = await db
    .select({ filename: statementUploads.filename })
    .from(statementUploads)
    .where(
      and(
        eq(statementUploads.userId, userId),
        eq(statementUploads.status, "completed"),
      ),
    );
  return [...new Set(rows.map((r) => r.filename))];
}

export interface UpdateStatementUploadInput {
  status: "completed" | "failed";
  errorMessage?: string | null;
  transactionCount?: number;
}

export async function updateStatementUpload(
  db: Db,
  id: string,
  input: UpdateStatementUploadInput,
): Promise<void> {
  await db
    .update(statementUploads)
    .set(input)
    .where(eq(statementUploads.id, id));
}
