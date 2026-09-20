import { requireAuth } from "$lib/server/api-auth";
import { getDb } from "$lib/server/db";
import { getAiCredentials } from "$lib/server/db/ai-credentials";
import { decryptSecret } from "$lib/server/crypto";
import { fetchWithRetry } from "$lib/server/http";
import { DEFAULT_CHAT_PROMPT } from "$lib/prompts";
import type { AiProvider } from "$lib/utils/ai-providers";
import { toReais } from "$lib/utils/money";

import { json } from "@sveltejs/kit";

import type { RequestHandler } from "./$types";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface ChatPayload {
  messages: ChatMessage[];
}

export const POST: RequestHandler = async ({ request, locals, platform }) => {
  requireAuth(locals.userId);

  const body = (await request.json().catch(() => null)) as ChatPayload | null;
  const messages = body?.messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return json({ error: "Mensagens inválidas." }, { status: 400 });
  }

  const db = getDb(platform!.env.DB);
  const aiCredentials = await getAiCredentials(db, locals.userId!);
  if (!aiCredentials) {
    return json(
      { error: "Configure uma chave de API de IA primeiro." },
      { status: 400 },
    );
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
      const res = await fetchWithRetry(
        "https://api.anthropic.com/v1/messages",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 1024,
            system: DEFAULT_CHAT_PROMPT,
            messages: messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
          }),
        },
      );
      if (!res.ok)
        return json({ error: `Erro na IA: ${res.status}` }, { status: 502 });
      const data = (await res.json()) as {
        content: Array<{ type: string; text?: string }>;
      };
      const text = data.content.find((b) => b.type === "text")?.text ?? "";
      return json({ reply: text.trim() });
    }

    // OpenAI-compatible (openai, deepseek)
    const apiUrl =
      provider === "deepseek"
        ? "https://api.deepseek.com/chat/completions"
        : "https://api.openai.com/v1/chat/completions";

    const res = await fetchWithRetry(apiUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: aiCredentials.model,
        messages: [
          { role: "system", content: DEFAULT_CHAT_PROMPT },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });
    if (!res.ok)
      return json({ error: `Erro na IA: ${res.status}` }, { status: 502 });
    const data = (await res.json()) as {
      choices: Array<{ message: { content?: string } }>;
    };
    return json({ reply: data.choices[0]?.message.content ?? "" });
  } catch (err) {
    return json(
      { error: err instanceof Error ? err.message : "Erro desconhecido na IA" },
      { status: 500 },
    );
  }
};
