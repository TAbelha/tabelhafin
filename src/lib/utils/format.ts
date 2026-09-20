import { toReais } from "./money";

const fullBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const normaliseZero = (n: number) => (Object.is(n, -0) ? 0 : n);

export function formatCurrency(cents: number): string {
  return fullBRL.format(normaliseZero(toReais(cents)));
}

const DISPLAY_TIME_ZONE = "UTC";

export function formatDate(ts: Date | string): string {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  });
}
