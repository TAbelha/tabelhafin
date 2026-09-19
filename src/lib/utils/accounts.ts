import { AccountType } from "$lib/enums/account-type";

export interface AccountBalance {
  type: AccountType | string;
  cachedBalance: number;
}

export function signedBalance(account: AccountBalance): number {
  return account.type === AccountType.CreditCard
    ? -account.cachedBalance
    : account.cachedBalance;
}

export function sumSignedBalance(accounts: AccountBalance[]): number {
  return accounts.reduce((sum, a) => sum + signedBalance(a), 0);
}
