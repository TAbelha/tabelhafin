import { requireAuth } from "$lib/server/api-auth";
import { errorJson } from "$lib/server/api-helpers";
import { getProviderHeaders, getProviderUrl } from "$lib/server/ai/providers";
import { getDb } from "$lib/server/db";
import { getAiCredentials } from "$lib/server/db/ai-credentials";
import { decryptSecret } from "$lib/server/crypto";
import { fetchWithRetry } from "$lib/server/http";
import { DEFAULT_CHAT_PROMPT } from "$lib/prompts";
import type { AiProvider } from "$lib/utils/ai-providers";

import { json } from "@sveltejs/kit";

import type { RequestHandler } from "./$types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPayload {
  messages: ChatMessage[];
}

const MAX_MESSAGES = 50;

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  requireAuth(locals.userId);

  const body = (await request.json().catch(() => null)) as ChatPayload | null;
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return errorJson("Mensagens inválidas.");
  }

  const trimmed = messages.slice(-MAX_MESSAGES);

  const db = getDb(platform!.env.DB);
  const aiCredentials = await getAiCredentials(db, locals.userId!);
  if (!aiCredentials) {
    return errorJson("Configure uma chave de API de IA primeiro.");
  }

  const apiKey = await decryptSecret(
    platform!.env.MASTER_KEY,
    {
      ciphertext: aiCredentials.keyEncrypted,
      nonce: aiCredentials.nonce,
      v: aiCredentials.v ?? undefined,
    },
    { purpose: "ai_credentials", userId: locals.userId! },
  );

  const provider = aiCredentials.provider as AiProvider;
  const model = aiCredentials.model;

  try {
    if (provider === "anthropic") {
      const res = await fetchWithRetry(getProviderUrl("anthropic"), {
        method: "POST",
        headers: getProviderHeaders("anthropic", apiKey),
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: DEFAULT_CHAT_PROMPT,
          messages: trimmed.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      if (!res.ok) return errorJson(`Erro na IA: ${res.status}`, 502);
      const data = (await res.json()) as {
        content: Array<{ type: string; text?: string }>;
      };
      const text = data.content.find((b) => b.type === "text")?.text ?? "";
      return json({ reply: text.trim() });
    }

    const res = await fetchWithRetry(getProviderUrl(provider), {
      method: "POST",
      headers: getProviderHeaders(provider, apiKey),
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: DEFAULT_CHAT_PROMPT },
          ...trimmed.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok) return errorJson(`Erro na IA: ${res.status}`, 502);
    const data = (await res.json()) as {
      choices: Array<{ message: { content?: string } }>;
    };
    return json({ reply: data.choices[0]?.message.content ?? "" });
  } catch (err) {
    return errorJson(
      err instanceof Error ? err.message : "Erro desconhecido na IA",
      500,
    );
  }
};
