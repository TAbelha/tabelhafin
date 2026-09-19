import { betterAuth } from "better-auth";
import { drizzleAdapter } from "@better-auth/drizzle-adapter";
import { sveltekitCookies } from "better-auth/svelte-kit";
import { getRequestEvent } from "$app/server";

import { getDb } from "$lib/server/db";

export function createAuth(db: D1Database) {
  return betterAuth({
    database: drizzleAdapter(getDb(db), { provider: "sqlite" }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    plugins: [sveltekitCookies(getRequestEvent)],
  });
}

export type Auth = ReturnType<typeof createAuth>;
