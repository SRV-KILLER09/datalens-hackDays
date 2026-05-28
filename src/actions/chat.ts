"use server";

import { Mixedbread } from "@mixedbread/sdk";
import Groq from "groq-sdk";
import { qdrant } from "../lib/qdrant";
import { v5 as uuidv5 } from "uuid";
import { db } from "../db";
import { schemaKnowledge, schemaDocImages } from "../db/schema";
import { eq, and, inArray, asc } from "drizzle-orm";
import { getSession } from "../lib/neo4j";
import { getEntitySchemaContext } from "./graphQueries";

const mxbai = new Mixedbread({ apiKey: process.env.MIXEDBREAD_API_KEY! });
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY! });

const NAMESPACE = "0ea2b2f2-67a0-4d67-95f0-9b8a99c9605c"; // Standard UUID namespace
const CHAT_COLLECTION_NAME = "schema_documentation_mxbai"; // 1024 dimensions collection

export async function checkEmbeddingStatus(connectionId: string) {
    try {
        const records = await db.select().from(schemaKnowledge).where(eq(schemaKnowledge.connectionId, connectionId));
        if (records.length === 0) return { embedded: false, total: 0, embeddedCount: 0 };

        let embeddedCount = 0;
        records.forEach(r => {
            if (r.embeddingId) embeddedCount++;
        });

        return {
            embedded: embeddedCount === records.length && records.length > 0,
            total: records.length,
            embeddedCount
        };
    } catch (e: any) {
        console.error("Failed to check embedding status:", e);
        return { embedded: false, total: 0, embeddedCount: 0 };
    }
}

export async function embedDocumentationData(connectionId: string) {
    if (!connectionId) return { success: false, error: "Connection ID required." };

    try {
        console.log(`[Chat Backend] Starting vector embedding for connection: ${connectionId}`);

        // 1. Fetch text from the `schemaKnowledge` table
        const docs = await db
            .select()
            .from(schemaKnowledge)
            .where(eq(schemaKnowledge.connectionId, connectionId));

        if (docs.length === 0) {
            return { success: false, error: "No documentation found to embed. Please SYNC AI first." };
        }

        const points = [];

        // 2. Iterate and generate embeddings via Mixedbread
        for (const doc of docs) {
            const textToEmbed = `Table: ${doc.entityName}\n\n${doc.markdownContent}`;

            console.log(`[Chat Backend] Embedding table node: ${doc.entityName} via Mixedbread-AI`);

            const res = await mxbai.embeddings.create({
                model: 'mixedbread-ai/mxbai-embed-large-v1',
                input: [textToEmbed],
                normalized: true
            });

            const vector = res.data[0].embedding as number[];
            const pointId = uuidv5(`${connectionId}-${doc.entityName}`, NAMESPACE);

            points.push({
                id: pointId,
                vector: vector,
                payload: {
                    connection_id: connectionId,
                    entity_name: doc.entityName,
                    content: textToEmbed,
                    type: "documentation"
                }
            });

            // 3. Update PG DB to log that it has been embedded
            await db.update(schemaKnowledge)
                .set({ embeddingId: pointId })
                .where(eq(schemaKnowledge.id, doc.id));
        }

        // 4. Batch Upsert to Qdrant with explicit collection verification
        try {
            await qdrant.getCollection(CHAT_COLLECTION_NAME);
        } catch (checkErr: any) {
            if (checkErr.status === 404) {
                console.log(`[Chat Backend] Collection ${CHAT_COLLECTION_NAME} not found. Creating it natively...`);
                await qdrant.createCollection(CHAT_COLLECTION_NAME, {
                    vectors: {
                        size: 1024,
                        distance: "Cosine"
                    }
                });

                // CRITICAL: Qdrant requires a payload index to filter by connection_id on vector search
                console.log(`[Chat Backend] Applying 'connection_id' keyword payload index...`);
                await qdrant.createPayloadIndex(CHAT_COLLECTION_NAME, {
                    field_name: "connection_id",
                    field_schema: "keyword"
                });

                console.log(`[Chat Backend] Collection created. Yielding 1s to allow Qdrant index initialization...`);
                await new Promise(res => setTimeout(res, 1000));
            } else {
                throw checkErr;
            }
        }

        console.log(`[Chat Backend] Upserting vectors into ${CHAT_COLLECTION_NAME}...`);
        await qdrant.upsert(CHAT_COLLECTION_NAME, {
            wait: true,
            points: points
        });

        console.log(`[Chat Backend] Successfully embedded ${points.length} documents into Qdrant.`);
        return { success: true, message: `Successfully embedded ${points.length} documentation tables.` };

    } catch (error: any) {
        console.error("Documentation embedding failed:", error);
        return { success: false, error: error.message };
    }
}

export async function chatWithSchema(query: string, connectionId: string, history: any[] = []) {
    let neo4jSession;
    try {
        console.log(`[Chat Backend] Received Query: "${query}"`);

        // 1. Convert user query to Vector embedding using Mixedbread
        const embedRes = await mxbai.embeddings.create({
            model: 'mixedbread-ai/mxbai-embed-large-v1',
            input: [query],
            normalized: true
        });
        const queryVector = embedRes.data[0].embedding as number[];

        // 2. Search Qdrant for Top 5 closest schema documentation nodes
        let searchResult;
        try {
            searchResult = await qdrant.search(CHAT_COLLECTION_NAME, {
                vector: queryVector,
                filter: {
                    must: [{ key: "connection_id", match: { value: connectionId } }]
                },
                limit: 5
            });
        } catch (searchErr: any) {
            console.error("Qdrant Search Error Detail:", JSON.stringify(searchErr?.data, null, 2));
            if (searchErr.status === 404) {
                console.warn(`[Chat Backend] Caught 404 on search: Collection ${CHAT_COLLECTION_NAME} missing.`);
                return { success: false, error: "Vector collection missing. Please click 'Re-sync Vectors' in the top right of the Chat window." };
            }
            throw searchErr;
        }

        const vectorContextItems = searchResult.map(hit => hit.payload as { entity_name: string, content: string });
        const vectorContextString = vectorContextItems.map(c => c.content).join("\n\n---\n\n");
        const discoveredEntities = vectorContextItems.map(c => c.entity_name);

        console.log(`[Chat Backend] Discovered context entities in Qdrant: ${discoveredEntities.join(", ")}`);

        // 3. Graph Database Expansion via Neo4j
        // If vector search found tables, let's trace their exact 1-degree connections in NeoDB 
        // just in case vector search missed an implicit relationship link.
        neo4jSession = getSession();
        let graphContextString = "";

        if (discoveredEntities.length > 0) {
            const graphRes = await neo4jSession.executeRead(async (tx: any) => {
                const cypher = `
                    MATCH (e:Entity)-[:HAS_FIELD]->(f:Field)-[:REFERENCES_FIELD]->(fk:Field)<-[:HAS_FIELD]-(ref:Entity)
                    WHERE e.name IN $entities OR ref.name IN $entities
                    RETURN e.name AS source, f.name AS source_field, ref.name AS target, fk.name AS target_field
                `;
                return await tx.run(cypher, { entities: discoveredEntities });
            });

            const relations: string[] = [];
            graphRes.records.forEach((record: any) => {
                relations.push(`- ${record.get('source')}.${record.get('source_field')} references ${record.get('target')}.${record.get('target_field')}`);
            });

            if (relations.length > 0) {
                graphContextString = "\n\nGRAPH RELATIONSHIPS INFERRED:\n" + [...new Set(relations)].join("\n");
                console.log(`[Chat Backend] Expanded ${relations.length} edge paths from Graph DB.`);
            }
        }

        // 4. Formulate Unified Context Payload
        const messages: any[] = [
            {
                role: "system",
                content: `
You are a database intelligence assistant.

Use the following context to answer accurately.
Do not hallucinate.

Graph Context:
${graphContextString}

Vector Documentation Context:
${vectorContextString}
`
            },
            {
                role: "user",
                content: query
            }
        ];

        console.log(`[Chat Backend] Requesting compound intelligence inference from Groq Cloud (llama-3.3-70b-versatile)...`);

        // 5. Stream inference from Groq (llama-3.3-70b-versatile acting as compound)
        const chatCompletion = await groq.chat.completions.create({
            messages: messages,
            model: "llama-3.3-70b-versatile",
            temperature: 0.2, // Low temp for factual data dictionary accuracy
            max_tokens: 1500
        });

        const answer = chatCompletion.choices[0]?.message?.content || "No response generated.";

        // 6. Inject citations and build final response
        const { answer: finalAnswer, citations } = await buildFinalChatResponse(answer, connectionId, discoveredEntities);

        console.log(`[Chat Backend] Groq inference successful. Generated ${citations.length} citations.`);

        return { success: true, answer: finalAnswer, citations };

    } catch (e: any) {
        console.error("Chat Action Error:", e);
        return { success: false, error: e.message };
    } finally {
        if (neo4jSession) {
            await neo4jSession.close();
        }
    }
}

// Helper: Fetch images for entities
async function fetchEntityImages(connectionId: string, entities: string[]) {
    if (!entities || entities.length === 0) return [];

    try {
        const uniqueEntities = Array.from(new Set(entities));
        const images = await db
            .select()
            .from(schemaDocImages)
            .where(
                and(
                    eq(schemaDocImages.connectionId, connectionId),
                    inArray(schemaDocImages.entityName, uniqueEntities)
                )
            )
            .orderBy(asc(schemaDocImages.pageNumber));

        const groupedImages = images.reduce((acc: Record<string, string[]>, img) => {
            if (!acc[img.entityName]) acc[img.entityName] = [];
            acc[img.entityName].push(img.imagePath);
            return acc;
        }, {});

        return Object.keys(groupedImages).map(entity => ({
            entity: entity,
            images: groupedImages[entity]
        }));
    } catch (err) {
        console.error("[Chat Backend] Failed to fetch entity images:", err);
        return [];
    }
}

// Helper: Inject citations into the answer
function injectCitations(answer: string, imageReferences: { entity: string, images: string[], schema?: any }[]) {
    let finalAnswer = answer;
    const citations: any[] = [];
    let marker = 1;

    for (const ref of imageReferences) {
        if (citations.length >= 8) break; // Limit to max 8 citations
        if (ref.images.length === 0 && !ref.schema) continue; // Skip if no images AND no schema

        const regex = new RegExp(`\\b(${ref.entity})\\b`, 'i');
        const match = finalAnswer.match(regex);

        if (match && match.index !== undefined) {
            // Found entity in text -> Inject immediately after the matched word
            const injectionPoint = match.index + match[0].length;
            finalAnswer = finalAnswer.substring(0, injectionPoint) + ` [${marker}]` + finalAnswer.substring(injectionPoint);
        } else {
            // Entity not found in text -> Append to the end
            finalAnswer += finalAnswer.endsWith('\n') ? `\n[${marker}] ${ref.entity} reference` : `\n\n[${marker}] ${ref.entity} reference`;
        }

        // Extract PKs and FKs from schema
        const pks = ref.schema?.columns?.filter((c: any) => c.isPrimaryKey).map((c: any) => c.name) || [];
        const fks = ref.schema?.columns?.filter((c: any) => c.isForeignKey).map((c: any) => ({
            column: c.name,
            references: c.references
        })) || [];

        citations.push({
            marker: marker,
            entity: ref.entity,
            images: ref.images,
            pks,
            fks
        });
        marker++;
    }

    return { answer: finalAnswer, citations };
}

// Helper: Build the complete Chat API response
async function buildFinalChatResponse(answer: string, connectionId: string, discoveredEntities: string[]) {
    const sortedEntities = Array.from(new Set(discoveredEntities)); // Deduplicate

    // Fetch both images and schema context in parallel
    const [imageReferences, schemaContexts] = await Promise.all([
        fetchEntityImages(connectionId, sortedEntities),
        Promise.all(sortedEntities.map(entity => getEntitySchemaContext(entity, connectionId)))
    ]);

    // Merge schema context into imageReferences structure
    const unifiedReferences = sortedEntities.map(entity => {
        const imageRef = imageReferences.find(r => r.entity === entity);
        const schemaRef = schemaContexts.find(s => s.tableName === entity);

        return {
            entity,
            images: imageRef?.images || [],
            schema: schemaRef
        };
    });

    const result = injectCitations(answer, unifiedReferences);
    return result;
}
