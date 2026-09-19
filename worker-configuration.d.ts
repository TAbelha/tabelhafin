/// <reference types="@cloudflare/workers-types" />

interface Env {
  DB: D1Database;
  DEVICE_TOKENS: KVNamespace;
  MASTER_KEY: string;
  BETTER_AUTH_SECRET: string;
  BETTER_AUTH_URL: string;
  CRON_SECRET: string;
  VAPID_PRIVATE_KEY: string;
  VAPID_PUBLIC_KEY: string;
  VAPID_SUBJECT: string;
}
