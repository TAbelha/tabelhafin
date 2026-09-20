import { cronHandler } from "$lib/server/cron-handler";
import { syncAllUsers } from "$lib/server/pluggy/sync";

export const POST = cronHandler(
  (env) => syncAllUsers(env),
  "sync",
);
