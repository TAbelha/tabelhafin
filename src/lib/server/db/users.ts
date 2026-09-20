import { eq } from "drizzle-orm";

import type { Db } from "./index";
import { users } from "./schema";

export async function findUserById(db: Db, id: string) {
  const [user] = await db.select().from(users).where(eq(users.id, id));
  return user ?? null;
}

export async function getAllUsers(db: Db) {
  return db.select().from(users);
}
