export type AiProviderType = "anthropic" | "openai" | "deepseek";

const PROVIDER_URLS: Record<AiProviderType, string> = {
  anthropic: "https://api.anthropic.com/v1/messages",
  openai: "https://api.openai.com/v1/chat/completions",
  deepseek: "https://api.deepseek.com/chat/completions",
};

export function getProviderUrl(provider: AiProviderType): string {
  const url = PROVIDER_URLS[provider];
  if (!url) throw new Error(`Provider de IA não suportado: ${provider}`);
  return url;
}

export function getProviderHeaders(
  provider: AiProviderType,
  apiKey: string,
): Record<string, string> {
  if (provider === "anthropic") {
    return {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    };
  }
  return {
    "content-type": "application/json",
    authorization: `Bearer ${apiKey}`,
  };
}
