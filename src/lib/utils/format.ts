import { toReais } from "./money";

const compactBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  notation: "compact",
  maximumFractionDigits: 1,
});

const fullBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const normaliseZero = (n: number) => (Object.is(n, -0) ? 0 : n);

export function formatCompactCurrency(
  cents: number,
  threshold = 100_000,
): string {
  const value = normaliseZero(toReais(cents));
  return Math.abs(value) >= threshold
    ? compactBRL.format(value)
    : fullBRL.format(value);
}

const labelBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

export function formatCurrencyLabel(value: unknown): string {
  if (value === null || value === undefined || value === "") return "";
  const n = Number(value);
  if (!Number.isFinite(n)) return "";
  return labelBRL.format(normaliseZero(toReais(n)));
}

export function formatCurrency(cents: number): string {
  return fullBRL.format(normaliseZero(toReais(cents)));
}

export function formatCompactNumber(
  cents: number,
  threshold = 100_000,
): string {
  const value = toReais(cents);
  if (Math.abs(value) < threshold)
    return normaliseZero(value).toLocaleString("pt-BR");
  return new Intl.NumberFormat("pt-BR", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(normaliseZero(value));
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

export function formatDateLong(ts: Date | string): string {
  const d = typeof ts === "string" ? new Date(ts) : ts;
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: DISPLAY_TIME_ZONE,
  });
}

export function toYearMonth(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function monthLabel(key: string): string {
  const [y, m] = key.split("-").map(Number);
  const label = new Date(y, m - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
