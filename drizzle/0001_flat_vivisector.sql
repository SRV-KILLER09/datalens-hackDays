CREATE TABLE "schema_doc_images" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"entity_name" text NOT NULL,
	"page_number" integer NOT NULL,
	"image_path" text NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "schema_knowledge" (
	"id" text PRIMARY KEY NOT NULL,
	"connection_id" text NOT NULL,
	"entity_name" text NOT NULL,
	"markdown_content" text NOT NULL,
	"summary" text,
	"embedding_id" text,
	"embedding" vector(768),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "unique_connection_entity" UNIQUE("connection_id","entity_name")
);
--> statement-breakpoint
ALTER TABLE "schema_knowledge" ADD CONSTRAINT "schema_knowledge_connection_id_connections_id_fk" FOREIGN KEY ("connection_id") REFERENCES "public"."connections"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "doc_images_conn_entity_idx" ON "schema_doc_images" USING btree ("connection_id","entity_name");--> statement-breakpoint
CREATE INDEX "idx_entity_name" ON "schema_knowledge" USING btree ("entity_name");