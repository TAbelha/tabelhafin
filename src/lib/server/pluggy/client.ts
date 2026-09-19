import { AccountType } from "$lib/enums/account-type";
import { fetchWithRetry } from "$lib/server/http";
import { toCents } from "$lib/utils/money";

const MY_API_URL = "https://my-api.pluggy.ai";

interface MyApiError {
  message?: string;
  code?: number;
}

export function jwtExpiresAt(jwt: string): number | null {
  const payload = jwt.split(".")[1];
  if (!payload) return null;
  try {
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const { exp } = JSON.parse(json) as { exp?: number };
    return typeof exp === "number" ? exp * 1000 : null;
  } catch {
    return null;
  }
}

async function myApiFetch(path: string, token: string): Promise<Response> {
  const res = await fetchWithRetry(`${MY_API_URL}${path}`, {
    headers: {
      authorization: `Bearer ${token}`,
      accept: "application/json",
    },
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as MyApiError | null;
    throw new Error(
      `My Pluggy API error (${path}): ${res.status} ${body?.message ?? res.statusText}`,
    );
  }
  return res;
}

export interface PluggyItem {
  id: string;
  institutionName: string;
  institutionType: string;
  status: string;
}

export async function fetchItems(token: string): Promise<PluggyItem[]> {
  const res = await myApiFetch("/items?only_my_items=true", token);
  const data = (await res.json()) as Array<{
    id: string;
    connector: { name: string; type: string };
    status: string;
  }>;
  return data.map((item) => ({
    id: item.id,
    institutionName: item.connector.name,
    institutionType: item.connector.type,
    status: item.status.toLowerCase(),
  }));
}

export interface PluggyAccount {
  id: string;
  type: AccountType.Checking | AccountType.CreditCard;
  name: string;
  currency: string;
  balance: number;
}

export async function fetchAccounts(
  token: string,
  itemIds: string[],
): Promise<PluggyAccount[]> {
  const params = itemIds.map((id) => `itemId=${id}`).join("&");
  const res = await myApiFetch(`/accounts?${params}`, token);
  const data = (await res.json()) as Array<{
    id: string;
    type: string;
    subtype?: string;
    name: string;
    currencyCode: string;
    balance: number;
  }>;
  return data.map((a) => ({
    id: a.id,
    type:
      a.subtype === "CREDIT_CARD" || a.type === "CREDIT"
        ? AccountType.CreditCard
        : AccountType.Checking,
    name: a.name,
    currency: a.currencyCode,
    balance: toCents(a.balance),
  }));
}

export interface PluggyTransaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  currency: string;
  category: string | null;
}

export async function fetchTransactions(
  token: string,
  accountIds: string[],
  from?: Date,
): Promise<PluggyTransaction[]> {
  const all: PluggyTransaction[] = [];
  for (const accountId of accountIds) {
    const params = new URLSearchParams({ accountId });
    if (from) params.set("from", from.toISOString().slice(0, 10));
    const res = await myApiFetch(`/transactions?${params}`, token);
    const data = (await res.json()) as Array<{
      id: string;
      description: string;
      amount: number;
      date: string;
      currencyCode: string;
      category?: string | null;
      amountInAccountCurrency?: number | null;
    }>;
    for (const t of data) {
      all.push({
        id: t.id,
        description: t.description,
        amount: toCents(t.amountInAccountCurrency ?? t.amount),
        date: t.date,
        currency: t.currencyCode,
        category: t.category ?? null,
      });
    }
  }
  return all;
}

export interface PluggyInvestment {
  id: string;
  name: string;
  balance: number;
  currency: string;
}

export async function fetchInvestments(
  token: string,
  itemIds: string[],
): Promise<PluggyInvestment[]> {
  const all: PluggyInvestment[] = [];
  for (const itemId of itemIds) {
    const res = await myApiFetch(`/investments?itemId=${itemId}`, token);
    const data = (await res.json()) as Array<{
      id: string;
      name: string;
      balance: number;
      value?: number;
      currencyCode?: string;
    }>;
    for (const i of data) {
      all.push({
        id: i.id,
        name: i.name,
        balance: toCents(i.balance ?? i.value ?? 0),
        currency: i.currencyCode ?? "BRL",
      });
    }
  }
  return all;
}
