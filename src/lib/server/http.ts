const DEFAULT_TIMEOUT_MS = 60_000;
const DEFAULT_RETRIES = 1;

const RETRIABLE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);

const MAX_RETRY_DELAY_MS = 10_000;

export interface FetchWithRetryOptions {
  timeoutMs?: number;
  retries?: number;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function retryDelayMs(res: Response | null, attempt: number): number {
  const header = res?.headers?.get("retry-after");
  if (header) {
    const seconds = Number(header);
    if (Number.isFinite(seconds) && seconds > 0) {
      return Math.min(seconds * 1000, MAX_RETRY_DELAY_MS);
    }
  }
  return Math.min(500 * 2 ** attempt, MAX_RETRY_DELAY_MS);
}

export async function fetchWithRetry(
  url: string,
  init: RequestInit = {},
  options: FetchWithRetryOptions = {},
): Promise<Response> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, retries = DEFAULT_RETRIES } = options;

  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        ...init,
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (attempt === retries || !RETRIABLE_STATUSES.has(res.status))
        return res;

      await sleep(retryDelayMs(res, attempt));
    } catch (err) {
      lastError ??= err;
      if (attempt === retries) break;
      await sleep(retryDelayMs(null, attempt));
    }
  }

  throw lastError;
}
