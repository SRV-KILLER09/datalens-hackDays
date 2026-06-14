CREATE TABLE IF NOT EXISTS "saved_queries" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
  "connection_id" text NOT NULL,
  "title" text NOT NULL,
  "natural_language" text,
  "sql" text NOT NULL,
  "tags" text,
  "is_favorite" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);
CREATE INDEX IF NOT EXISTS "idx_saved_queries_user_conn" ON "saved_queries" ("user_id", "connection_id");
