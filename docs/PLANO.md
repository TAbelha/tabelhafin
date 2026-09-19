# PLANO: tabelhafin v2

App de finanças pessoais hospedado. Puxa Nubank + XP sozinho (Open Finance via Meu Pluggy), categoriza com IA BYOK, gera relatório mensal com narrativa IA + PDF + push. Público: usuários externos. AGPL-3.0.

## Stack

| Camada    | Escolha                                                 |
| --------- | ------------------------------------------------------- |
| Framework | SvelteKit 5 (runes) + `@sveltejs/adapter-cloudflare`    |
| UI        | Tailwind CSS 4 + shadcn-svelte (bits-ui)                |
| Charts    | shadcn-svelte chart (Recharts)                          |
| DB        | Drizzle ORM + D1                                        |
| Auth      | Better Auth + D1                                        |
| IA        | fetch: Anthropic Messages / OpenAI Responses / DeepSeek |
| PDF       | Typst WASM (jsDelivr CDN)                               |
| Takeout   | fflate + postal-mime (client-side)                      |
| Push      | `@block65/webcrypto-web-push` (VAPID)                   |
| PWA       | `@vite-pwa/sveltekit` (generateSW, prompt)              |
| Testes    | Vitest (server) + Playwright (e2e)                      |
| Money     | centavos inteiros                                       |

## Decisões (log)

| #   | Decisão                                                   | Razão                                    |
| --- | --------------------------------------------------------- | ---------------------------------------- |
| D1  | Hospedado (CF Workers), não self-hosted                   | fricção setup                            |
| D2  | IA BYOK (chave do usuário, 3 providers)                   | custo próprio                            |
| D3  | Meu Pluggy API interna (JWT ~24h), não comercial          | gratuita                                 |
| D4  | PDF direto pro modelo (document understanding)            | zero lib parsing no workerd              |
| D5  | Capability gating `supportsDocuments`                     | DeepSeek não suporta                     |
| D6  | Categorização em lote (100 tx/chamada)                    | custo                                    |
| D7  | `category_source='user'` nunca recategorizado             | respeito à correção                      |
| D8  | Dedupe cross-source PDF→Pluggy (±3d, mesmo valor)         | auditoria, não delete                    |
| D9  | Dinheiro em centavos inteiros                             | zero float                               |
| D10 | Auth standalone: Better Auth + D1                         | app aberto pra externos                  |
| D11 | Sessões no D1 (Better Auth), não KV                       | Better Auth nativo; KV pra device tokens |
| D12 | Envelope encryption v2: HKDF → AES-256-GCM, context-bound | isola segredos                           |
| D13 | Typst WASM p/ PDF do relatório                            | tipografia de qualidade                  |
| D14 | Extensão adiada (Fase 5), colar token até lá              | simplifica v1                            |
| D15 | Charts via shadcn-svelte chart (Recharts)                 | consistente com UI                       |
| D16 | Datas em UTC, storage em timestamp int                    | consistência                             |
| D17 | Sem migração dados antigos, começa zerado                 | clean slate                              |

## Infra Cloudflare

- D1 `tabelhafin-db`
- KV: device tokens da extensão
- Secrets: `MASTER_KEY`, `VAPID_*`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`
- Crons: `0 6 * * *` sync; `0 7 1 * *` relatório
- Staging: `triggers.crons: []`

## Schema D1

```sql
-- Better Auth
user (id, name, email, emailVerified, image, timezone, default_currency,
      hide_ai, ai_categorization_enabled, ai_report_enabled,
      ai_chat_enabled, seen_onboarding, created_at, updated_at)
session (id, userId, token, ipAddress, userAgent, expiresAt, created_at, updated_at)
account (id, userId, accountId, providerId, password, created_at, updated_at)
verification (id, identifier, value, expiresAt)

-- IA
ai_credentials (user_id PK, provider, model, key_encrypted, nonce, v)
user_ai_prompts (user_id PK, categorization_prompt, report_prompt, chat_system_prompt)

-- Open Finance
pluggy_credentials (user_id PK, token_encrypted, token_nonce, v, token_expires_at, created_at)
pluggy_items (id, user_id, pluggy_item_id UNIQUE, institution_name, institution_type,
              status, last_synced_at, last_sync_attempt_at)
finance_accounts (id, user_id, pluggy_item_id, pluggy_account_id UNIQUE, institution,
                  type, name, currency, cached_balance)

-- Transações
transactions (id, user_id, account_id SET NULL, pluggy_transaction_id UNIQUE,
              statement_upload_id SET NULL, date, description, amount, currency,
              source, pluggy_category, category, category_source,
              dedupe_hash, superseded_by_transaction_id)
  Índices: (user_id,date), (user_id,category), (account_id)

-- Import
statement_uploads (id, user_id, filename, status, error_message, transaction_count, created_at)
statement_reviews (id, user_id, source, bank, filename, status, extracted_json,
                   approved_json, transaction_count, duplicate_count,
                   error_message, created_at, applied_at)

-- Relatórios
monthly_reports (id, user_id, year_month, summary_json, model_used, generated_at)

-- Push
push_subscriptions (id, user_id, endpoint UNIQUE, p256dh, auth, created_at)

-- Organização
user_categories (user_id + name PK, color, created_at)
categorization_rules (id, user_id, description, category) UNIQUE(user_id, description)
tags (id, user_id, name) UNIQUE(user_id, name)
transaction_tags (transaction_id + tag_id PK composto)
tag_rules (id, user_id, description, tag_name) UNIQUE(user_id, description, tag_name)

-- Recorrentes
recurring_expenses (id, user_id, description, amount, category, frequency,
                    next_charge_date, is_active, created_at, updated_at)

-- Chat
chat_conversations (id, user_id, title, created_at, updated_at)
chat_messages (id, conversation_id, role, content, created_at)
```

## Fases

### Fase 0: Fundação

Specs: `docs/specs/000-arquitetura.md`, `001-auth.md`

- Scaffold SvelteKit + Tailwind 4 + shadcn-svelte
- Schema Drizzle completo + migrações
- Better Auth standalone (email+senha, sessão D1)
- `crypto.ts`: envelope encryption v2 (HKDF → AES-256-GCM)
- `hooks.server.ts`: sessão + security headers
- Utils: money, format, forms, enums
- CI: check + lint + test + build

### Fase 1: Núcleo financeiro

Specs: `010-openfinance-sync.md`, `011-ai-config.md`, `012-transacoes.md`, `013-categorizacao.md`, `014-dashboard.md`

- Cliente Pluggy (my-api.pluggy.ai, fetchWithRetry)
- Sync diário 06:00 (dedupe FNV-1a, supersede ±3d, transferências internas)
- Config IA BYOK (3 providers, prompts custom)
- CRUD transações + 3 camadas categorização (rules → keyword → IA batch 100)
- Dashboard (shadcn chart, 4 stat cards, donut, barra, recentes)

### Fase 2: Organização

Specs: `020-categorias.md`, `021-tags.md`, `022-recorrentes.md`

- Categorias custom + regras (delete migra, rename propaga)
- Tags + regras (backfill idempotente)
- Recorrentes + upcoming (projeção N meses)

### Fase 3: Importação

Specs: `030-takeout.md`, `031-pdf.md`, `032-csv-ofx.md`, `033-review.md`

- Takeout zip (fflate + postal-mime, fila sequencial)
- PDF único (AI document understanding, gating)
- CSV/OFX (parsers Nubank CSV, OFX XML)
- Review (edit, approve, apply, cancel)

### Fase 4: IA avançada

Specs: `040-relatorio.md`, `041-chat.md`, `042-push-pwa.md`

- Relatório mensal (cron dia 1, narrativa IA, Typst PDF, push)
- Chat IA (SSE streaming, contexto financeiro, 3 providers)
- PWA + Web Push (VAPID, service worker)

### Fase 5: Periferia

Specs: `050-onboarding.md`, `051-extensao.md`, `052-perfil-lgpd.md`, `053-marketing.md`

- Onboarding wizard (IA → Pluggy, skippable)
- Extensão MV3 (capture token meu.pluggy.ai)
- Perfil (export, erase, delete, LGPD)
- Marketing landing (hero, features, roadmap)

## Regras de negócio (portadas)

- **Dedupe**: FNV-1a 32-bit `accountId:amount:YYYY-MM-DD`
- **Supersede**: PDF→Pluggy quando `abs(amount)` igual, ±3 dias, mesma conta ou PDF sem conta
- **Transferências internas**: categorias não-gasto; espelho ±2d valor oposto conta diferente; self-transfer por nome
- **Categorização 3-tier**: regras do usuário (exato) → keyword offline (substring, prioridade fixa) → batch IA (100 tx, tool_use, truncamento detectado, falha parcial OK)
- **`category_source='user'`**: nunca recategorizado por regras ou IA
- **Cooldown sync**: 15min entre syncs manuais
- **Recovery sync**: items nunca sincronizados → sync no page load (skipAi opcional)
- **Cron sync**: 06:00 UTC diário, `lastSyncAttemptAt` sempre, `lastSyncedAt` só sucesso
- **Cron relatório**: dia 1 07:00, idempotente por year_month, push "Relatório pronto"
- **Dinheiro**: sempre centavos inteiros; `parseCents` pt-BR na entrada, `formatCurrency` na saída

## Riscos

1. **Pluggy ToS**: abrir pra externos pode violar uso pessoal — confirmar antes de lançar
2. **Better Auth + D1**: validar drizzle adapter; fallback: sessões em KV
3. **Teste real Pluggy**: precisa da tua conta conectada pra e2e
