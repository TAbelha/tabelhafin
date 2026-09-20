import { json, type RequestEvent } from "@sveltejs/kit";

export function cronHandler(fn: (env: Env) => Promise<void>, label: string) {
  return async ({ request, platform }: RequestEvent) => {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${platform!.env.CRON_SECRET}`) {
      return json({ error: "Unauthorized" }, { status: 401 });
    }

    platform!.context.waitUntil(
      fn(platform!.env).catch((err) => {
        console.error(`[cron/${label}] failed`, {
          error: err instanceof Error ? err.message : String(err),
        });
      }),
    );

    return json({ ok: true });
  };
}
