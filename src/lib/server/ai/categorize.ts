import { DEFAULT_CATEGORIZATION_PROMPT } from "$lib/prompts";
import { fetchWithRetry } from "$lib/server/http";
import { getProviderUrl, getProviderHeaders, type AiProviderType } from "$lib/server/ai/providers";
import type { AiProvider } from "$lib/utils/ai-providers";
import { toReais } from "$lib/utils/money";

const BATCH_SIZE = 100;

function maxTokensForBatch(count: number): number {
  return Math.min(16000, 512 + count * 48);
}

function chunk<T>(items: T[], size: number): T[][] {
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    batches.push(items.slice(i, i + size));
  }
  return batches;
}

export interface TransactionToCategorize {
  id: string;
  description: string;
  amount: number;
  date: string;
}

export interface CategorizedTransaction {
  id: string;
  category: string;
}

interface CategorizeInput {
  provider: AiProvider;
  model: string;
  apiKey: string;
  categories: string[];
  customPrompt?: string;
  transactions: TransactionToCategorize[];
}

function categorizeSchema(categories: string[]) {
  return {
    type: "object",
    properties: {
      results: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: {
              type: "string",
              description: "O mesmo id da transação fornecida no contexto",
            },
            category: { type: "string", enum: categories },
          },
          required: ["id", "category"],
        },
        description:
          "Uma entrada por transação fornecida no contexto, na mesma quantidade.",
      },
    },
    required: ["results"],
  };
}

const CATEGORIZE_TOOL = {
  name: "categorize_transactions",
  description:
    "Categoriza cada transação financeira fornecida em exatamente uma categoria",
};

function formatTransactions(transactions: TransactionToCategorize[]): string {
  return transactions
    .map(
      (t) =>
        `- id=${t.id} | ${t.date} | ${t.description} | valor=${toReais(t.amount).toFixed(2)}`,
    )
    .join("\n");
}

function systemPrompt(
  transactions: TransactionToCategorize[],
  categories: string[],
  customPrompt?: string,
): string {
  if (customPrompt) {
    return (
      `${customPrompt}\n\nCategorias válidas: ${categories.join(", ")}.\n\n` +
      `Transações a categorizar:\n${formatTransactions(transactions)}\n\n` +
      `Chame a ferramenta categorize_transactions com um resultado por transação, na mesma quantidade recebida (um id pode não se repetir).`
    );
  }
  return (
    `${DEFAULT_CATEGORIZATION_PROMPT.replace("[categorias do usuário]", categories.join(", "))}\n\n` +
    `Transações a categorizar:\n${formatTransactions(transactions)}\n\n` +
    `Chame a ferramenta categorize_transactions com um resultado por transação, na mesma quantidade recebida (um id pode não se repetir).`
  );
}

export async function categorizeTransactions(
  input: CategorizeInput,
): Promise<CategorizedTransaction[]> {
  if (input.transactions.length === 0) return [];

  const batches = chunk(input.transactions, BATCH_SIZE);

  if (batches.length === 1)
    return categorizeBatch({ ...input, transactions: batches[0] });

  const results: CategorizedTransaction[] = [];
  let failed = 0;
  for (const [index, batch] of batches.entries()) {
    try {
      results.push(
        ...(await categorizeBatch({ ...input, transactions: batch })),
      );
    } catch (err) {
      failed++;
      console.error("[ai/categorize] batch failed", {
        batch: index + 1,
        of: batches.length,
        size: batch.length,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  if (failed === batches.length) {
    throw new Error(
      `IA falhou em todos os ${batches.length} lotes de categorização`,
    );
  }
  return results;
}

function categorizeBatch(
  input: CategorizeInput,
): Promise<CategorizedTransaction[]> {
  if (input.provider === "anthropic") return categorizeWithAnthropic(input);
  if (input.provider === "openai") return categorizeWithOpenAI(input);
  if (input.provider === "deepseek") return categorizeWithDeepSeek(input);
  throw new Error(`Provider de IA não suportado: ${input.provider}`);
}

async function categorizeWithAnthropic(
  input: CategorizeInput,
): Promise<CategorizedTransaction[]> {
  const res = await fetchWithRetry(getProviderUrl("anthropic"), {
    method: "POST",
    headers: getProviderHeaders("anthropic", input.apiKey),
    body: JSON.stringify({
      model: input.model,
      max_tokens: maxTokensForBatch(input.transactions.length),
      system: systemPrompt(
        input.transactions,
        input.categories,
        input.customPrompt,
      ),
      messages: [
        { role: "user", content: "Categorize as transações do contexto." },
      ],
      tools: [
        {
          name: CATEGORIZE_TOOL.name,
          description: CATEGORIZE_TOOL.description,
          input_schema: categorizeSchema(input.categories),
        },
      ],
      tool_choice: { type: "any" },
    }),
  });
  if (!res.ok)
    throw new Error(`Anthropic API error: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as {
    content: Array<{ type: string; name?: string; input?: unknown }>;
    stop_reason?: string;
  };

  if (data.stop_reason === "max_tokens") {
    throw new Error(
      `Resposta da IA truncada (${input.transactions.length} transações no lote) — reduza o lote`,
    );
  }

  const toolUse = data.content.find((block) => block.type === "tool_use");
  if (!toolUse)
    throw new Error("IA não retornou uma categorização estruturada");
  return toResults(toolUse.input, input.categories);
}

async function categorizeWithOpenAiCompatible(
  input: CategorizeInput,
  provider: AiProviderType,
): Promise<CategorizedTransaction[]> {
  const res = await fetchWithRetry(getProviderUrl(provider), {
    method: "POST",
    headers: getProviderHeaders(provider, input.apiKey),
    body: JSON.stringify({
      model: input.model,
      messages: [
        {
          role: "system",
          content: systemPrompt(
            input.transactions,
            input.categories,
            input.customPrompt,
          ),
        },
        { role: "user", content: "Categorize as transações do contexto." },
      ],
      tools: [
        {
          type: "function",
          function: {
            name: CATEGORIZE_TOOL.name,
            description: CATEGORIZE_TOOL.description,
            parameters: categorizeSchema(input.categories),
          },
        },
      ],
      tool_choice: "required",
    }),
  });
  if (!res.ok)
    throw new Error(`Provider error: ${res.status} ${await res.text()}`);

  const data = (await res.json()) as {
    choices: Array<{
      message: {
        tool_calls?: Array<{ function: { name: string; arguments: string } }>;
      };
      finish_reason?: string;
    }>;
  };

  if (data.choices[0]?.finish_reason === "length") {
    throw new Error(
      `Resposta da IA truncada (${input.transactions.length} transações no lote) — reduza o lote`,
    );
  }

  const toolCall = data.choices[0]?.message.tool_calls?.[0];
  if (!toolCall)
    throw new Error("IA não retornou uma categorização estruturada");
  return toResults(JSON.parse(toolCall.function.arguments), input.categories);
}

async function categorizeWithOpenAI(
  input: CategorizeInput,
): Promise<CategorizedTransaction[]> {
  return categorizeWithOpenAiCompatible(input, "openai");
}

async function categorizeWithDeepSeek(
  input: CategorizeInput,
): Promise<CategorizedTransaction[]> {
  return categorizeWithOpenAiCompatible(input, "deepseek");
}

function toResults(
  rawInput: unknown,
  categories: string[],
): CategorizedTransaction[] {
  const parsed = rawInput as {
    results?: Array<{ id: string; category: string }>;
  };
  if (!parsed.results)
    throw new Error("IA retornou uma categorização em formato inesperado");
  return parsed.results.filter((r): r is CategorizedTransaction =>
    categories.includes(r.category),
  );
}
