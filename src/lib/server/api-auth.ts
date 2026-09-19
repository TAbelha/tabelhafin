export function requireAuth(
  userId: string | null | undefined,
): asserts userId is string {
  if (!userId) {
    throw new Response(JSON.stringify({ error: "Não autenticado." }), {
      status: 401,
      headers: { "content-type": "application/json" },
    });
  }
}

export function unauthorizedJson() {
  return new Response(JSON.stringify({ error: "Não autenticado." }), {
    status: 401,
    headers: { "content-type": "application/json" },
  });
}
