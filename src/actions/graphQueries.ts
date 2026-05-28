"use server";

import { getSession } from "../lib/neo4j";

/**
 * Finds the shortest path between two specific tables.
 * Useful for LLMs to trace how to join two distant tables across foreign keys.
 */
export async function findShortestPathBetweenEntities(sourceTableName: string, targetTableName: string, connectionId: string) {
    const session = getSession();
    try {
        const result = await session.executeRead((tx: any) =>
            tx.run(`
                MATCH (start:Entity {name: $sourceTableName, connectionId: $connectionId}),
                      (end:Entity {name: $targetTableName, connectionId: $connectionId}),
                      p = shortestPath((start)-[:REFERENCES*]-(end))
                RETURN [n IN nodes(p) | n.name] AS path
            `, { sourceTableName, targetTableName, connectionId })
        );

        if (result.records.length === 0) return null;
        return result.records[0].get('path');
    } finally {
        await session.close();
    }
}

/**
 * Retrieves all tables that are directly connected (depth=1) to a given table.
 * Useful for building precise context windows for SQL generation.
 */
export async function getRelatedTables(entityName: string, connectionId: string) {
    const session = getSession();
    try {
        const result = await session.executeRead((tx: any) =>
            tx.run(`
                MATCH (e:Entity {name: $entityName, connectionId: $connectionId})-[:REFERENCES]-(related:Entity)
                RETURN collect(DISTINCT related.name) AS relatedTables
            `, { entityName, connectionId })
        );

        if (result.records.length === 0) return [];
        return result.records[0].get('relatedTables');
    } finally {
        await session.close();
    }
}

/**
 * Extracts the full schema context for a specific table, including its columns and foreign key targets.
 * Highly optimized context string intended to be injected directly into LLM prompts.
 */
export async function getEntitySchemaContext(entityName: string, connectionId: string) {
    const session = getSession();
    try {
        // Query extracts the table, its fields, and any fields it references
        const result = await session.executeRead((tx: any) =>
            tx.run(`
                MATCH (e:Entity {name: $entityName, connectionId: $connectionId})-[:HAS_FIELD]->(f:Field)
                OPTIONAL MATCH (f)-[:REFERENCES_FIELD]->(targetF:Field)<-[:HAS_FIELD]-(targetE:Entity)
                RETURN 
                    f.name AS columnName, 
                    f.type AS dataType, 
                    f.isNullable AS isNullable, 
                    f.isPrimaryKey AS isPK,
                    f.isForeignKey AS isFK,
                    targetE.name AS referencesTable,
                    targetF.name AS referencesColumn
                ORDER BY f.name
            `, { entityName, connectionId })
        );

        const columns = result.records.map((r: any) => ({
            name: r.get('columnName'),
            type: r.get('dataType'),
            isNullable: r.get('isNullable'),
            isPrimaryKey: r.get('isPK'),
            isForeignKey: r.get('isFK'),
            references: r.get('referencesTable') ? `${r.get('referencesTable')}.${r.get('referencesColumn')}` : null
        }));

        return { tableName: entityName, columns };
    } finally {
        await session.close();
    }
}
