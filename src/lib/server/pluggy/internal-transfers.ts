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
