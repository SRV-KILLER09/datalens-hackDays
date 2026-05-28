"use server";

import { db } from "../db";
import { entities, fields, relationships } from "../db/schema";
import { eq, inArray } from "drizzle-orm";
import { getSession } from "../lib/neo4j";

// Define the fallback URI for guest mode

export async function buildGraphForInference(connectionId: string) {
    if (!connectionId) return { success: false, error: "Connection ID required." };

    let session;

    try {
        // Handle guest mode by normalizing the connectionId if needed
        // or ensure your Relational DB has metadata synced for this specific string ID.
        const dbEntities = await db.select().from(entities).where(eq(entities.connectionId, connectionId));

        if (dbEntities.length === 0) {
            return { success: false, error: "Please click on 'Sync Tables' first to populate metadata." };
        }

        const entityIds = dbEntities.map(e => e.id);
        const dbFields = await db.select().from(fields).where(inArray(fields.entityId, entityIds));
        const fieldIds = dbFields.map(f => f.id);

        let dbRelationships: any[] = [];
        if (fieldIds.length > 0) {
            dbRelationships = await db.select().from(relationships).where(inArray(relationships.sourceFieldId, fieldIds));
        }

        const fieldEntityMap = new Map();
        dbFields.forEach(f => fieldEntityMap.set(f.id, f.entityId));

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
                const isForeignKey = dbRelationships.some((r: any) => r.sourceFieldId === field.id);

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

            for (const rel of dbRelationships) {
                await tx.run(`
                    MATCH (source:Field {id: $sourceId})
                    MATCH (target:Field {id: $targetId})
                    MERGE (source)-[:REFERENCES_FIELD]->(target)
                `, {
                    sourceId: rel.sourceFieldId,
                    targetId: rel.targetFieldId
                });

                const sourceEntityId = fieldEntityMap.get(rel.sourceFieldId);
                const targetEntityId = fieldEntityMap.get(rel.targetFieldId);

                if (sourceEntityId && targetEntityId) {
                    await tx.run(`
                        MATCH (sourceE:Entity {id: $sourceId})
                        MATCH (targetE:Entity {id: $targetId})
                        MERGE (sourceE)-[:REFERENCES]->(targetE)
                    `, {
                        sourceId: sourceEntityId,
                        targetId: targetEntityId
                    });
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