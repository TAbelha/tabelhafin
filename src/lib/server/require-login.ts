import { error } from "@sveltejs/kit";

export function requireLogin(userId: string | null): asserts userId is string {
  if (!userId) {
    error(401, "Faça login para continuar.");
  }
}
