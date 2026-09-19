export const INTERNAL_TRANSFER_CATEGORIES = new Set([
  "Investments",
  "Fixed income",
  "Third party transfers",
  "Same person transfer",
  "Credit card payment",
  "Internal transfer",
]);

export const INTERNAL_TRANSFER_DESCRIPTIONS = new Set([
  "Pagamento de fatura",
  "Pagamento recebido",
]);

export function isInternalTransfer(
  pluggyCategory: string | null | undefined,
  description?: string | null,
): boolean {
  const byCategory =
    pluggyCategory !== null && pluggyCategory !== undefined
      ? INTERNAL_TRANSFER_CATEGORIES.has(pluggyCategory)
      : false;
  if (byCategory) return true;
  return description ? INTERNAL_TRANSFER_DESCRIPTIONS.has(description) : false;
}

export function normalizeName(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function isSelfTransferByDescription(
  description: string | null,
  fullName: string,
): boolean {
  if (!description) return false;
  const name = normalizeName(fullName);
  if (!name) return false;
  return normalizeName(description).includes(name);
}
