-- schema_knowledge.sql
-- User requested raw SQL implementation 

CREATE TABLE IF NOT EXISTS schema_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_name TEXT NOT NULL,
    markdown_content TEXT NOT NULL,
    summary TEXT,
    embedding_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
    connection_id TEXT NOT NULL,
    CONSTRAINT unique_connection_entity UNIQUE (connection_id, entity_name)
);

-- Index for fast lookup on entity_name
CREATE INDEX IF NOT EXISTS idx_schema_knowledge_entity_name ON schema_knowledge(entity_name);

-- Trigger to auto-update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_schema_knowledge_updated_at ON schema_knowledge;

CREATE TRIGGER trg_schema_knowledge_updated_at
BEFORE UPDATE ON schema_knowledge
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
