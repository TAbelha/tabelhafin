export function computeDedupeHash(
  accountId: string,
  amount: number,
  date: Date,
): string {
  const day = date.toISOString().slice(0, 10);
  const input = `${accountId}:${amount}:${day}`;

  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}
