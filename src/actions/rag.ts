"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { getDatabaseMetadata, getConnectionStringById } from "./db";
import { qdrant, COLLECTION_NAME } from "../lib/qdrant";
import { v5 as uuidv5 } from "uuid";
import { db } from "../db";
import { entities, fields, relationships, schemaKnowledge, connections } from "../db/schema";
import { eq, inArray, and } from "drizzle-orm";
import { getSession } from "../lib/neo4j";
import { generateDocumentationImages, saveImageMetadata } from "./puppeteerGenerator";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const NAMESPACE = "8019c11c-b7db-4985-9c69-c44ded20f014"; // Standard UUID namespace

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
            model: "gemini-3.1-flash-lite",
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

        let connectionString = "";
        try {
            const connObj = await db.select({ userId: connections.userId, tableUri: connections.tableUri }).from(connections).where(eq(connections.id, connectionId)).limit(1);
            const userId = connObj[0]?.userId || "";
            connectionString = connObj[0]?.tableUri || "";
            await getOrGenerateBusinessReport(connectionId, userId);
        } catch (e) {
            console.error(e);
        }

        if (connectionString) {
            try {
                console.log(`[RAG Backend] Automatically indexing database in Qdrant for connection: ${connectionId}`);
                await indexRemoteDatabase(connectionId, connectionString);
            } catch (err) {
                console.error("[RAG Backend] Automatic Qdrant indexing failed:", err);
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

        // Check if collection exists and create if missing
        const collectionsRes = await qdrant.getCollections();
        const exists = collectionsRes.collections.some(c => c.name === COLLECTION_NAME);
        if (!exists) {
            console.log(`[Qdrant] Collection ${COLLECTION_NAME} missing. Creating it...`);
            await qdrant.createCollection(COLLECTION_NAME, {
                vectors: {
                    size: 3072,
                    distance: "Cosine"
                }
            });
            await qdrant.createPayloadIndex(COLLECTION_NAME, {
                field_name: "connection_id",
                field_schema: "keyword",
                wait: true
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

function extractSqlFromResponse(text: string): string {
    const codeBlockMatch = text.match(/```(?:sql|postgresql)?\s*([\s\S]*?)```/i);
    if (codeBlockMatch) return codeBlockMatch[1].trim();
    const selectMatch = text.match(/((?:WITH|SELECT)[\s\S]+)/i);
    return selectMatch ? selectMatch[1].trim() : text.trim();
}

export async function textToSqlAction(userQuestion: string, connectionId: string) {
    try {
        const contextResult = await getRelevantTables(userQuestion, connectionId);

        if (!contextResult.success) {
            return { success: false, error: contextResult.error || "Failed to fetch schema context." };
        }
        if (!contextResult.data || contextResult.data.length === 0) {
            return { success: false, error: "Could not find relevant schema context. Sync your tables first." };
        }

        const contextString = contextResult.data
            .map((c: any) => c.content)
            .join("\n");

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            systemInstruction: `You are a PostgreSQL expert. Given schema context, write precise read-only SQL queries.
Rules:
- Only generate SELECT or WITH queries (read-only).
- Always append LIMIT 100 unless the user asks for a specific count/limit.
- Use correct table and column names from the schema.
- Return a brief explanation (1-2 sentences) followed by a PostgreSQL code block.`
        });

        const prompt = `
SCHEMA CONTEXT:
${contextString}

USER QUESTION:
${userQuestion}

Respond with:
1. A short explanation of what the query does.
2. A PostgreSQL code block with the SQL.`;

        const result = await model.generateContent(prompt);
        const fullText = result.response.text();
        const sql = extractSqlFromResponse(fullText);
        const explanation = fullText.replace(/```[\s\S]*?```/g, "").trim();

        return { success: true, data: { sql, explanation, raw: fullText } };
    } catch (e: any) {
        console.error("Text-to-SQL Error:", e);
        return { success: false, error: e.message };
    }
}

export async function askAiAction(userQuestion: string, connectionId: string, userId?: string) {
    try {
        let contextString = "";

        // 1. Try Qdrant vector search first
        const contextResult = await getRelevantTables(userQuestion, connectionId);

        if (contextResult.success && contextResult.data && contextResult.data.length > 0) {
            contextString = contextResult.data.map((c: any) => c.content).join("\n");
        } else {
            // 2. Fallback: pull live schema directly from the DB (no sync required)
            console.log("[askAiAction] Qdrant empty — falling back to live schema inspection.");
            const FALLBACK_URI = process.env.NEXT_PUBLIC_FALLBACK_URI!;
            let uri = FALLBACK_URI;
            if (connectionId !== "demo-neon-db" && userId) {
                const { getConnectionStringById: getUri } = await import("./db");
                uri = (await getUri(connectionId, userId)) || FALLBACK_URI;
            }
            const metaResult = await getDatabaseMetadata(uri);
            if (!metaResult.success || !metaResult.data) {
                return { success: false, error: "Could not load schema context. Try syncing the connection first." };
            }
            const tableMap: Record<string, string[]> = {};
            metaResult.data.schema.forEach((col: any) => {
                const t = col.table_name;
                if (!tableMap[t]) tableMap[t] = [];
                tableMap[t].push(`${col.column_name} (${col.data_type})`);
            });
            contextString = Object.entries(tableMap)
                .map(([table, cols]) => `Table "${table}" contains columns: ${cols.join(", ")}.`)
                .join("\n");
        }

        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            systemInstruction: `You are a database expert and data analyst. Given a schema context, answer the user's question clearly.
            If the question asks for SQL, write a precise read-only SELECT query with LIMIT 100.
            If the question is analytical, provide a concise business-level answer.
            CRITICAL: Large dataset detected (500k+ rows). Always append 'LIMIT 100' to SELECT statements to prevent timeouts.`
        });

        const prompt = `
SCHEMA CONTEXT:
${contextString}

USER QUESTION:
${userQuestion}

TASK:
Answer the question. If SQL is needed, return a PostgreSQL code block with LIMIT 100.
        `;

        const result = await model.generateContent(prompt);
        return { success: true, answer: result.response.text() };

    } catch (e: any) {
        console.error("AI Action Error:", e);
        return { success: false, error: e.message };
    }
}

export async function getOrGenerateBusinessReport(connectionId: string, userId: string) {
    if (!connectionId) return { success: false, error: "Connection ID required." };
    try {
        const [cached] = await db
            .select()
            .from(schemaKnowledge)
            .where(
                and(
                    eq(schemaKnowledge.connectionId, connectionId),
                    eq(schemaKnowledge.entityName, "__business_report__")
                )
            )
            .limit(1);
        if (cached) {
            try {
                const parsed = JSON.parse(cached.markdownContent);
                return { success: true, data: parsed };
            } catch (err) {
            }
        }
        const dbEntities = await db
            .select()
            .from(entities)
            .where(eq(entities.connectionId, connectionId));
        if (dbEntities.length === 0) {
            return { success: false, error: "No metadata found. Please SYNC AI first." };
        }
        const entityIds = dbEntities.map(e => e.id);
        const dbFields = await db
            .select()
            .from(fields)
            .where(inArray(fields.entityId, entityIds));
        const connString = await getConnectionStringById(connectionId, userId);
        let rowCounts: Record<string, number> = {};
        let relationsCount = 0;
        let dbMetadataResult = null;
        if (connString) {
            dbMetadataResult = await getDatabaseMetadata(connString);
            if (dbMetadataResult.success && dbMetadataResult.data) {
                const counts = dbMetadataResult.data.counts || [];
                counts.forEach((c: any) => {
                    rowCounts[c.table_name || c.TABLE_NAME] = parseInt(c.row_count || c.ROW_COUNT || 0);
                });
                const schema = dbMetadataResult.data.schema || [];
                const seenFks = new Set();
                schema.forEach((col: any) => {
                    if (col.is_foreign_key && col.foreign_table_name) {
                        seenFks.add(`${col.table_name}->${col.foreign_table_name}`);
                    }
                });
                relationsCount = seenFks.size;
            }
        }
        const tableCount = dbEntities.length;
        const columnCount = dbFields.length;
        const totalRows = Object.values(rowCounts).reduce((a, b) => a + b, 0);
        const piiKeywords = ["email", "phone", "ssn", "address", "password", "card", "cvv", "mobile", "secret", "token"];
        const piiColumns = dbFields.filter(f =>
            piiKeywords.some(kw => f.name.toLowerCase().includes(kw))
        );
        const piiCount = piiColumns.length;
        const schemaSummary = dbEntities.map(entity => {
            const tableFields = dbFields.filter(f => f.entityId === entity.id);
            const columnsStr = tableFields.map(f => `${f.name} (${f.type}${f.isNullable ? '' : ' NOT NULL'}${f.isPrimaryKey ? ' PK' : ''})`).join(", ");
            const rows = rowCounts[entity.name] || 0;
            return `Table "${entity.name}" (${rows} rows): [${columnsStr}]`;
        }).join("\n");
        const systemPrompt = `You are a senior enterprise data architect and data quality auditor.
Your task is to analyze the provided database schema metadata and generate a comprehensive Business Report in JSON format.

The JSON response MUST exactly match the following structure:
{
  "domain": "string (e.g. Music Retail / Digital Media, eCommerce, etc.)",
  "overview": "string (1-2 sentences overview of the database purpose)",
  "keyFindings": ["string", "string", "string", "string"],
  "recommendations": ["string", "string", "string", "string"],
  "dataGovernance": "string (governance paragraph addressing PII, security, access control)",
  "overallAssessment": "string (one-sentence overall assessment of the database state)",
  "healthScore": number (health score percentage between 50 and 100),
  "qualityIssues": [
    {
      "severity": "critical" or "warning",
      "table": "string (table name)",
      "column": "string (column name)",
      "issue": "string (short description of the issue, e.g. Column 'Company' has 83.05% null values)",
      "suggestion": "string (remediation suggestion, e.g. Consider making 'Company' NOT NULL or implementing a default value strategy.)"
    }
  ]
}

Strict Rules:
- Output valid JSON only. Do NOT include markdown code blocks like \`\`\`json.
- No commentary or additional keys.
- Estimate realistic quality issues based on schema patterns (e.g. missing primary keys, columns with names like 'Company' or 'Fax' or 'Composer' having warnings if they are nullable, table names without relationships, or fields representing passwords that should be protected).`;

        const prompt = `Analyze this database schema and generate the Business Report JSON:\n\n${schemaSummary}`;
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            systemInstruction: systemPrompt
        });
        const result = await model.generateContent(prompt);
        let textResult = result.response.text();
        textResult = textResult.replace(/```(?:json)?/gi, "").trim();
        const parsedReport = JSON.parse(textResult);
        parsedReport.tableCount = tableCount;
        parsedReport.columnCount = columnCount;
        parsedReport.totalRows = totalRows;
        parsedReport.piiCount = piiCount;
        parsedReport.relationsCount = relationsCount;
        const criticalCount = parsedReport.qualityIssues.filter((q: any) => q.severity === "critical").length;
        const warningCount = parsedReport.qualityIssues.filter((q: any) => q.severity === "warning").length;
        const calculatedHealth = Math.max(50, Math.min(100, 100 - (criticalCount * 4) - (warningCount * 1.5)));
        parsedReport.healthScore = parseFloat(calculatedHealth.toFixed(1));
        await db
            .insert(schemaKnowledge)
            .values({
                connectionId: connectionId,
                entityName: "__business_report__",
                markdownContent: JSON.stringify(parsedReport),
                updatedAt: new Date()
            })
            .onConflictDoUpdate({
                target: [schemaKnowledge.connectionId, schemaKnowledge.entityName],
                set: { markdownContent: JSON.stringify(parsedReport), updatedAt: new Date() }
            });
        return { success: true, data: parsedReport };
    } catch (error: any) {
        console.error("Failed to get or generate business report:", error);
        return { success: false, error: error.message };
    }
}

export async function analyzeQueryResultsAction(userQuestion: string, sql: string, dataSample: any[]) {
    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-3.1-flash-lite",
            systemInstruction: `You are a data analyst. Given a user question, the SQL query used, and a small sample of the JSON results, provide a brief business insight (1-3 sentences) and recommend the best visualization type.
Respond in strict JSON format:
{
  "insight": "string",
  "recommendedChart": "bar" | "pie" | "line",
  "labelKey": "string (the column name to use for X-axis or Pie slices)",
  "valueKey": "string (the column name to use for Y-axis or Pie values)"
}`
        });

        const prompt = `USER QUESTION: ${userQuestion}\nSQL: ${sql}\nDATA SAMPLE (first 5 rows): ${JSON.stringify(dataSample.slice(0, 5))}`;
        const result = await model.generateContent(prompt);
        let textResult = result.response.text();
        textResult = textResult.replace(/```(?:json)?/gi, "").trim();
        return { success: true, data: JSON.parse(textResult) };
    } catch (e: any) {
        console.error("AI Analysis Error:", e);
        return { success: false, error: e.message };
    }
}
