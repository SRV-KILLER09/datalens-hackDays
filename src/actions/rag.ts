"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDatabaseMetadata } from "./db";
import { qdrant, COLLECTION_NAME } from "../lib/qdrant";
import { v5 as uuidv5 } from "uuid";
import { db } from "../db";
import { entities, fields, relationships, schemaKnowledge } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { getSession } from "../lib/neo4j";
import { generateDocumentationImages, saveImageMetadata } from "./puppeteerGenerator";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const NAMESPACE = "0ea2b2f2-67a0-4d67-95f0-9b8a99c9605c"; // Standard UUID namespace

export async function syncAIDocumentation(connectionId: string) {
    if (!connectionId) return { success: false, error: "Connection ID required." };

    let session;
    try {
        // 1. Fetch Metadata from Relational Database (Drizzle)
        const dbEntities = await db
            .select()
            .from(entities)
            .where(eq(entities.connectionId, connectionId));

        console.log(`[RAG Backend] Found ${dbEntities.length} entities to document via Gemini.`);

        if (dbEntities.length === 0) {
            console.warn("[RAG Backend] Sync aborted: No entities found for connection:", connectionId);
            return { success: false, error: "No tables/entities mapped in metadata yet. Please run SYNC TABLES first." };
        }

        const entityIds = dbEntities.map(e => e.id);
        const dbFields = await db
            .select()
            .from(fields)
            .where(inArray(fields.entityId, entityIds));

        // 2. Initialize Neo4j Session for specific Relationship Queries
        session = getSession();

        // 3. Setup Gemini Model instance with strict parameters
        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash",
            systemInstruction: `You are a senior enterprise data architect and technical documentation expert.

Your task is to generate high-quality, professional database documentation in clean Markdown format.

You are given structured schema JSON describing:
- table name
- fields (type, nullable, primary key, foreign key)
- relationships (foreign key mappings)

Follow these strict formatting rules:

1. Use proper Markdown syntax only.
2. Do NOT use ASCII separators like "|------|----|".
3. Use properly formatted Markdown tables.
4. If composite primary keys exist, clearly mention them in a separate section.
5. Keep descriptions concise and professional.
6. Do NOT invent fields or relationships.
7. Do NOT repeat redundant information.
8. Do NOT include implementation commentary.
9. Output Markdown only.

Documentation Structure:

# {Table Name}

## Overview
Short professional business-level explanation of what the table represents.

## Schema Summary
- Total Fields: X
- Primary Keys: ...
- Foreign Keys: ...
- Relationships: ...

## Fields

| Column | Type | Nullable | Key | Description |
|--------|------|----------|-----|-------------|

- If composite primary key exists, explicitly mention:
  "This table uses a composite primary key consisting of (...)."

## Relationships

Clearly list:
- \`column_name\` → \`referenced_table.referenced_column\`
- Explain relationship type (one-to-many / many-to-many if inferable)

Tone:
- Clean
- Enterprise
- Technical
- Precise

Return Markdown only.`
        });

        // 4. Iterate over each entity and build JSON payload
        for (const entity of dbEntities) {
            const tableFields = dbFields.filter(f => f.entityId === entity.id);

            // Query Neo4j for exact relationships hitting this specific node
            const neo4jResult = await session.executeRead(async (tx: any) => {
                const query = `
                    MATCH (e:Entity {id: $entityId})-[:HAS_FIELD]->(sourceBase:Field)
                    OPTIONAL MATCH (sourceBase)-[:REFERENCES_FIELD]->(targetField:Field)<-[:HAS_FIELD]-(targetEntity:Entity)
                    RETURN sourceBase, targetField, targetEntity
                `;
                return await tx.run(query, { entityId: entity.id });
            });

            // Parse Neo4j relationships safely
            const parsedRelationships: any[] = [];
            neo4jResult.records.forEach((record: any) => {
                const srcBase = record.get('sourceBase');
                const tgtField = record.get('targetField');
                const tgtEntity = record.get('targetEntity');

                if (tgtField && tgtEntity) {
                    parsedRelationships.push({
                        field: srcBase.properties.name,
                        references_table: tgtEntity.properties.name,
                        references_field: tgtField.properties.name
                    });
                }
            });

            // Construct exact JSON syntax requested
            const payload = {
                table: entity.name,
                fields: tableFields.map(f => ({
                    name: f.name,
                    type: f.type,
                    nullable: f.isNullable,
                    is_primary_key: f.isPrimaryKey,
                    is_foreign_key: parsedRelationships.some(r => r.field === f.name)
                })),
                relationships: parsedRelationships
            };

            console.log(`[RAG Backend] Querying Gemini for documentation of ${entity.name}`);

            // 5. Query LLM to translate JSON to Documentation Markdown
            const prompt = `Generate documentation for the following database table schema object:\n\n${JSON.stringify(payload, null, 2)}`;
            const result = await model.generateContent(prompt);
            let markdownContent = result.response.text();

            // Stripping any LLM code block wrappers just in case
            markdownContent = markdownContent.replace(/^```markdown\n/, "").replace(/\n```$/, "");

            console.log(`[RAG Backend] Upserting mapped documentation for ${entity.name}`);

            // 6. Save the Markdown to schemaKnowledge table deterministically
            await db
                .insert(schemaKnowledge)
                .values({
                    connectionId: connectionId,
                    entityName: entity.name,
                    markdownContent: markdownContent,
                    updatedAt: new Date()
                })
                .onConflictDoUpdate({
                    target: [schemaKnowledge.connectionId, schemaKnowledge.entityName],
                    set: { markdownContent: markdownContent, updatedAt: new Date() }
                });

            // 7. Generate and save styled images of the documentation using Puppeteer
            const imageResult = await generateDocumentationImages(connectionId, entity.name, markdownContent);
            if (imageResult.success && imageResult.images) {
                await saveImageMetadata(connectionId, entity.name, imageResult.images);
            } else {
                console.error(`[RAG Backend] Image generation failed for ${entity.name}:`, imageResult.error);
            }
        }

        return { success: true, message: `Successfully generated documentation for ${dbEntities.length} tables.` };

    } catch (error: any) {
        console.error("Documentation generation failed:", error);
        return { success: false, error: error.message };
    } finally {
        if (session) {
            await session.close();
        }
    }
}
export async function indexRemoteDatabase(connectionId: string, connectionString: string) {
    try {
        const result = await getDatabaseMetadata(connectionString);
        if (!result.success || !result.data) {
            return { success: false, error: result.error || "Failed to fetch metadata" };
        }

        const { schema } = result.data;
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

        const tableData: Record<string, string[]> = {};
        schema.forEach((col: any) => {
            const tableName = col.table_name;
            if (!tableData[tableName]) tableData[tableName] = [];
            tableData[tableName].push(`${col.column_name} (${col.data_type})`);
        });

        const points = [];

        for (const [tableName, columns] of Object.entries(tableData)) {
            const description = `Database table "${tableName}" contains columns: ${columns.join(", ")}.`;
            const embedResult = await model.embedContent(description);
            const vector = embedResult.embedding.values;

            // Generate a stable ID so re-indexing updates the same point
            const pointId = uuidv5(`${connectionId}-${tableName}`, NAMESPACE);

            points.push({
                id: pointId,
                vector: vector,
                payload: {
                    connection_id: connectionId,
                    table_name: tableName,
                    content: description,
                    updated_at: new Date().toISOString()
                }
            });
        }

        await qdrant.upsert(COLLECTION_NAME, {
            wait: true,
            points: points
        });

        return { success: true, message: "Database indexed in Qdrant successfully" };
    } catch (error: any) {
        console.error("Qdrant Indexing Error:", error);
        return { success: false, error: error.message };
    }
}

export async function getRelevantTables(userQuery: string, connectionId: string) {
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
        const queryEmbed = await model.embedContent(userQuery);
        const vector = queryEmbed.embedding.values;

        const searchResult = await qdrant.search(COLLECTION_NAME, {
            vector: vector,
            filter: {
                must: [{ key: "connection_id", match: { value: connectionId } }]
            },
            limit: 8
        });

        return {
            success: true,
            data: searchResult.map(hit => hit.payload)
        };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function askAiAction(userQuestion: string, connectionId: string) {
    try {
        const contextResult = await getRelevantTables(userQuestion, connectionId);

        if (!contextResult.success || !contextResult.data || contextResult.data.length === 0) {
            return { success: false, error: "Could not find relevant schema context." };
        }

        const contextString = contextResult.data
            .map((c: any) => c.content)
            .join("\n");

        const model = genAI.getGenerativeModel({
            model: "gemini-3-flash",
            systemInstruction: `You are a PostgreSQL expert. Given a schema, write a query. 
            CRITICAL: Large dataset detected (500k+ rows). Always append 'LIMIT 100' 
            to SELECT statements to prevent timeouts.`
        });

        const prompt = `
            SCHEMA CONTEXT:
            ${contextString}

            USER QUESTION:
            ${userQuestion}

            TASK:
            Return a PostgreSQL code block. Include 'LIMIT 100' unless the user asks for a specific count/limit.
        `;

        const result = await model.generateContent(prompt);
        return { success: true, answer: result.response.text() };

    } catch (e: any) {
        console.error("AI Action Error:", e);
        return { success: false, error: e.message };
    }
}