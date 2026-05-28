import { pgTable, text, timestamp, boolean, customType, unique, index, integer } from "drizzle-orm/pg-core";

// Custom type for pgvector support
// 768 dimensions matches 'gemini-embedding-001' and 'text-embedding-004'
const vector = customType<{ data: number[] }>({
  dataType() {
    return "vector(768)";
  },
});

// Auth Tables
export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});

export const connections = pgTable("connections", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  tableUri: text("table_uri").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// RAG Knowledge Table
export const schemaKnowledge = pgTable("schema_knowledge", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  connectionId: text("connection_id")
    .notNull()
    .references(() => connections.id, { onDelete: "cascade" }),
  entityName: text("entity_name").notNull(),
  markdownContent: text("markdown_content").notNull(),
  summary: text("summary"),
  embeddingId: text("embedding_id"),
  embedding: vector("embedding"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  unique("unique_connection_entity").on(t.connectionId, t.entityName),
  index("idx_entity_name").on(t.entityName)
]);
// Metadata Tables
export const entities = pgTable("entities", {
  id: text("id").primaryKey(),
  connectionId: text("connection_id").notNull().references(() => connections.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const fields = pgTable("fields", {
  id: text("id").primaryKey(),
  entityId: text("entity_id").notNull().references(() => entities.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  type: text("type").notNull(),
  isNullable: boolean("is_nullable").notNull().default(true),
  isPrimaryKey: boolean("is_primary_key").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const relationships = pgTable("relationships", {
  id: text("id").primaryKey(),
  sourceFieldId: text("source_field_id").notNull().references(() => fields.id, { onDelete: 'cascade' }),
  targetFieldId: text("target_field_id").notNull().references(() => fields.id, { onDelete: 'cascade' }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const schemaDocImages = pgTable("schema_doc_images", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  connectionId: text("connection_id").notNull(),
  entityName: text("entity_name").notNull(),
  pageNumber: integer("page_number").notNull(),
  imagePath: text("image_path").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
}, (t) => [
  index("doc_images_conn_entity_idx").on(t.connectionId, t.entityName)
]);