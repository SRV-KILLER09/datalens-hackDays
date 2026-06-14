"use server";

import { db } from "../db";
import { entities, fields, relationships, connections } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { getSession } from "../lib/neo4j";
import { getDatabaseRelations } from "./db";

// Define the fallback URI for guest mode

export async function buildGraphForInference(connectionId: string) {
    if (!connectionId) return { success: false, error: "Connection ID required." };

    let session;

    try {
        let uri = "";
        if (connectionId === "demo-neon-db") {
            uri = process.env.NEXT_PUBLIC_FALLBACK_URI || "";
        } else {
            const [conn] = await db.select().from(connections).where(eq(connections.id, connectionId)).limit(1);
            uri = conn?.tableUri || "";
        }

        if (!uri) {
            return { success: false, error: "Could not resolve connection URI." };
        }

        const dbEntities = await db.select().from(entities).where(eq(entities.connectionId, connectionId));

        if (dbEntities.length === 0) {
            return { success: false, error: "Please click on 'Sync Tables' first to populate metadata." };
        }

        const entityIds = dbEntities.map(e => e.id);
        const dbFields = await db.select().from(fields).where(inArray(fields.entityId, entityIds));

        // Get live relations (includes standard + polymorphic)
        const relResult = await getDatabaseRelations(uri);
        const activeRels = relResult.success && relResult.data ? relResult.data.relations : [];

        const entityMap = new Map();
        const entityIdToName = new Map();
        dbEntities.forEach(e => {
            entityMap.set(e.name, e.id);
            entityIdToName.set(e.id, e.name);
        });

        const fieldMap = new Map();
        dbFields.forEach(f => {
            const entName = entityIdToName.get(f.entityId);
            if (entName) {
                fieldMap.set(`${entName}.${f.name}`, f.id);
            }
        });

        session = getSession();

        await session.executeWrite(async (tx: any) => {
            await tx.run(`
                MATCH (n:Entity {connectionId: $connectionId})
                DETACH DELETE n
            `, { connectionId });

            await tx.run(`
                MATCH (f:Field {connectionId: $connectionId})
                DETACH DELETE f
            `, { connectionId });

            for (const entity of dbEntities) {
                await tx.run(`
                    MERGE (e:Entity {id: $id})
                    SET e.name = $name, e.connectionId = $connectionId
                `, {
                    id: entity.id,
                    name: entity.name,
                    connectionId: entity.connectionId
                });
            }

            for (const field of dbFields) {
                const entName = entityIdToName.get(field.entityId);
                const isForeignKey = activeRels.some((r: any) => r.source_table === entName && r.source_column === field.name);

                await tx.run(`
                    MERGE (f:Field {id: $id})
                    SET f.name = $name, 
                        f.type = $type, 
                        f.isNullable = $isNullable, 
                        f.isPrimaryKey = $isPrimaryKey, 
                        f.isForeignKey = $isForeignKey,
                        f.connectionId = $connectionId
                `, {
                    id: field.id,
                    name: field.name,
                    type: field.type,
                    isNullable: field.isNullable,
                    isPrimaryKey: field.isPrimaryKey,
                    isForeignKey,
                    connectionId
                });

                await tx.run(`
                    MATCH (e:Entity {id: $entityId})
                    MATCH (f:Field {id: $fieldId})
                    MERGE (e)-[:HAS_FIELD]->(f)
                `, {
                    entityId: field.entityId,
                    fieldId: field.id
                });
            }

            for (const rel of activeRels) {
                const sourceId = fieldMap.get(`${rel.source_table}.${rel.source_column}`);
                const targetId = fieldMap.get(`${rel.target_table}.${rel.target_column}`);

                if (sourceId && targetId) {
                    await tx.run(`
                        MATCH (source:Field {id: $sourceId})
                        MATCH (target:Field {id: $targetId})
                        MERGE (source)-[r:REFERENCES_FIELD]->(target)
                        SET r.type = $type
                    `, {
                        sourceId,
                        targetId,
                        type: rel.relation_type || "one_to_many"
                    });

                    const sourceEntityId = entityMap.get(rel.source_table);
                    const targetEntityId = entityMap.get(rel.target_table);

                    if (sourceEntityId && targetEntityId) {
                        await tx.run(`
                            MATCH (sourceE:Entity {id: $sourceId})
                            MATCH (targetE:Entity {id: $targetId})
                            MERGE (sourceE)-[r:REFERENCES]->(targetE)
                            SET r.type = $type
                        `, {
                            sourceId: sourceEntityId,
                            targetId: targetEntityId,
                            type: rel.relation_type || "one_to_many"
                        });
                    }
                }
            }
        });

        return { success: true, message: `Successfully pushed ${dbEntities.length} entities to Neo4j.` };

    } catch (error: any) {
        console.error("Graph build failed:", error);
        return { success: false, error: error.message };
    } finally {
        if (session) {
            await session.close();
        }
    }
}