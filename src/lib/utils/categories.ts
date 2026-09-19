export const TRANSACTION_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Lazer",
  "Compras",
  "Educação",
  "Assinaturas",
  "Investimentos",
  "Transferências",
  "Renda",
  "Outros",
] as const;

export type BuiltinCategory = (typeof TRANSACTION_CATEGORIES)[number];

export type TransactionCategory = string;

export const CATEGORY_COLORS: Record<BuiltinCategory, string> = {
  Alimentação: "ctp-peach",
  Transporte: "ctp-sky",
  Moradia: "ctp-mauve",
  Saúde: "ctp-green",
  Lazer: "ctp-pink",
  Compras: "ctp-yellow",
  Educação: "ctp-blue",
  Assinaturas: "ctp-sapphire",
  Investimentos: "ctp-teal",
  Transferências: "ctp-surface1",
  Renda: "ctp-green",
  Outros: "ctp-overlay1",
};

export function getCategoryColor(
  categories: { name: string; color: string }[],
  name: string | null,
): string {
  if (!name) return CATEGORY_COLORS.Outros;
  return (
    categories.find((c) => c.name === name)?.color ?? CATEGORY_COLORS.Outros
  );
}
