export function toReais(cents: number): number {
  return cents / 100;
}

export function toCents(reais: number): number {
  return Math.round(reais * 100);
}

export function parseCents(raw: unknown): number | null {
  const text = String(raw ?? "").trim();
  if (!text) return null;

  const normalised = text.includes(",")
    ? text.replace(/\./g, "").replace(",", ".")
    : text;

  const value = Number(normalised);
  return Number.isFinite(value) ? toCents(value) : null;
}
