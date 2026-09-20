import { json } from "@sveltejs/kit";

export function errorJson(message: string, status = 400) {
  return json({ error: message }, { status });
}

export function okJson(data?: Record<string, unknown>) {
  return json({ ok: true, ...data });
}
