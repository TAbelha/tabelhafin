import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

// ─── Better Auth tables ───────────────────────────────────────────────────────

export const users = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull().default(""),
  email: text("email").notNull().unique(),
  emailVerified: integer("emailVerified", { mode: "boolean" })
    .notNull()
    .default(false),
  image: text("image"),
  timezone: text("timezone").notNull().default("UTC"),
  defaultCurrency: text("default_currency").notNull().default("BRL"),
  hideAi: integer("hide_ai", { mode: "boolean" }).notNull().default(false),
  aiCategorizationEnabled: integer("ai_categorization_enabled", {
    mode: "boolean",
  })
    .notNull()
    .default(true),
  aiReportEnabled: integer("ai_report_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  aiChatEnabled: integer("ai_chat_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  seenOnboarding: integer("seen_onboarding", { mode: "boolean" })
    .notNull()
    .default(false),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const sessions = sqliteTable("session", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  expiresAt: integer("expiresAt", { mode: "timestamp" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const authAccounts = sqliteTable("accounts", {
  id: text("id").primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── IA (BYOK) ────────────────────────────────────────────────────────────────

export const aiCredentials = sqliteTable("ai_credentials", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  keyEncrypted: text("key_encrypted").notNull(),
  nonce: text("nonce").notNull(),
  v: integer("v"),
});

// ─── Open Finance (Meu Pluggy) ────────────────────────────────────────────────

export const pluggyCredentials = sqliteTable("pluggy_credentials", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenEncrypted: text("token_encrypted").notNull(),
  tokenNonce: text("token_nonce").notNull(),
  v: integer("v"),
  tokenExpiresAt: integer("token_expires_at", { mode: "timestamp" }),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const pluggyItems = sqliteTable("pluggy_items", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  pluggyItemId: text("pluggy_item_id").notNull().unique(),
  institutionName: text("institution_name").notNull(),
  institutionType: text("institution_type").notNull(),
  status: text("status").notNull(),
  lastSyncedAt: integer("last_synced_at", { mode: "timestamp" }),
  lastSyncAttemptAt: integer("last_sync_attempt_at", { mode: "timestamp" }),
});

export const financeAccounts = sqliteTable("finance_accounts", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  pluggyItemId: text("pluggy_item_id")
    .notNull()
    .references(() => pluggyItems.id, { onDelete: "cascade" }),
  pluggyAccountId: text("pluggy_account_id").notNull().unique(),
  institution: text("institution").notNull(),
  type: text("type").notNull(),
  name: text("name").notNull(),
  currency: text("currency").notNull().default("BRL"),
  cachedBalance: integer("cached_balance").notNull().default(0),
});

// ─── Transações ───────────────────────────────────────────────────────────────

export const transactions = sqliteTable(
  "transactions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    accountId: text("account_id").references(() => financeAccounts.id, {
      onDelete: "set null",
    }),
    pluggyTransactionId: text("pluggy_transaction_id").unique(),
    statementUploadId: text("statement_upload_id").references(
      () => statementUploads.id,
      {
        onDelete: "set null",
      },
    ),
    date: integer("date", { mode: "timestamp" }).notNull(),
    description: text("description").notNull(),
    amount: integer("amount").notNull(),
    currency: text("currency").notNull().default("BRL"),
    source: text("source").notNull(),
    pluggyCategory: text("pluggy_category"),
    category: text("category"),
    categorySource: text("category_source"),
    dedupeHash: text("dedupe_hash"),
    supersededByTransactionId: text("superseded_by_transaction_id"),
  },
  (table) => [
    index("idx_transactions_user_date").on(table.userId, table.date),
    index("idx_transactions_user_category").on(table.userId, table.category),
    index("idx_transactions_account").on(table.accountId),
  ],
);

// ─── Import de extratos ───────────────────────────────────────────────────────

export const statementUploads = sqliteTable("statement_uploads", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  status: text("status").notNull().default("pending"),
  errorMessage: text("error_message"),
  transactionCount: integer("transaction_count").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const statementReviews = sqliteTable("statement_reviews", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  source: text("source").notNull(),
  bank: text("bank"),
  filename: text("filename").notNull(),
  status: text("status").notNull().default("pending"),
  extractedJson: text("extracted_json"),
  approvedJson: text("approved_json"),
  transactionCount: integer("transaction_count").notNull().default(0),
  duplicateCount: integer("duplicate_count").notNull().default(0),
  errorMessage: text("error_message"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  appliedAt: integer("applied_at", { mode: "timestamp" }),
});

// ─── Relatórios ───────────────────────────────────────────────────────────────

export const monthlyReports = sqliteTable("monthly_reports", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  yearMonth: text("year_month").notNull(),
  summaryJson: text("summary_json").notNull(),
  modelUsed: text("model_used").notNull(),
  generatedAt: integer("generated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Push ─────────────────────────────────────────────────────────────────────

export const pushSubscriptions = sqliteTable("push_subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  endpoint: text("endpoint").notNull().unique(),
  p256dh: text("p256dh").notNull(),
  auth: text("auth").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Prompts IA customizados ──────────────────────────────────────────────────

export const userAiPrompts = sqliteTable("user_ai_prompts", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  categorizationPrompt: text("categorization_prompt"),
  reportPrompt: text("report_prompt"),
  chatSystemPrompt: text("chat_system_prompt"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Despesas recorrentes ─────────────────────────────────────────────────────

export const recurringExpenses = sqliteTable("recurring_expenses", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: integer("amount").notNull(),
  category: text("category"),
  frequency: text("frequency").notNull().default("monthly"),
  nextChargeDate: integer("next_charge_date", { mode: "timestamp" }),
  isActive: integer("is_active", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Chat IA ──────────────────────────────────────────────────────────────────

export const chatConversations = sqliteTable("chat_conversations", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull().default("Nova conversa"),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
  updatedAt: integer("updated_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

export const chatMessages = sqliteTable("chat_messages", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id")
    .notNull()
    .references(() => chatConversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp" })
    .notNull()
    .$defaultFn(() => new Date()),
});

// ─── Categorias ───────────────────────────────────────────────────────────────

export const userCategories = sqliteTable(
  "user_categories",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    color: text("color").notNull().default("muted"),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [primaryKey({ columns: [table.userId, table.name] })],
);

export const categorizationRules = sqliteTable(
  "categorization_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    category: text("category").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("categorization_rules_user_description").on(
      table.userId,
      table.description,
    ),
  ],
);

// ─── Tags ─────────────────────────────────────────────────────────────────────

export const tags = sqliteTable(
  "tags",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [uniqueIndex("tags_user_name").on(table.userId, table.name)],
);

export const transactionTags = sqliteTable(
  "transaction_tags",
  {
    transactionId: text("transaction_id")
      .notNull()
      .references(() => transactions.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (table) => [primaryKey({ columns: [table.transactionId, table.tagId] })],
);

export const tagRules = sqliteTable(
  "tag_rules",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    description: text("description").notNull(),
    tagName: text("tag_name").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => [
    uniqueIndex("tag_rules_user_description_tag").on(
      table.userId,
      table.description,
      table.tagName,
    ),
  ],
);
