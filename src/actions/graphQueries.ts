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

export type ColumnLineageNode = {
    table: string;
    column: string;
    direction: "source" | "target" | "focus";
};

export type ColumnLineageEdge = {
    sourceTable: string;
    sourceColumn: string;
    targetTable: string;
    targetColumn: string;
};

/**
 * Traces column-level FK lineage upstream and downstream.
 * Answers: "If I delete/change this column, what else is affected?"
 */
export async function getColumnLineage(
    tableName: string,
    columnName: string,
    connectionId: string
) {
    const session = getSession();
    try {
        const downstreamResult = await session.executeRead((tx: any) =>
            tx.run(`
                MATCH (focus:Field {connectionId: $connectionId})<-[:HAS_FIELD]-(focusEntity:Entity {name: $tableName, connectionId: $connectionId})
                WHERE focus.name = $columnName
                OPTIONAL MATCH path = (focus)-[:REFERENCES_FIELD*1..5]->(downstream:Field)
                WITH focus, focusEntity, collect(DISTINCT downstream) AS downstreamFields
                UNWIND downstreamFields AS df
                OPTIONAL MATCH (df)<-[:HAS_FIELD]-(de:Entity)
                RETURN focus.name AS focusColumn, focusEntity.name AS focusTable,
                       collect(DISTINCT {table: de.name, column: df.name}) AS downstream
            `, { tableName, columnName, connectionId })
        );

        const upstreamResult = await session.executeRead((tx: any) =>
            tx.run(`
                MATCH (focus:Field {connectionId: $connectionId})<-[:HAS_FIELD]-(focusEntity:Entity {name: $tableName, connectionId: $connectionId})
                WHERE focus.name = $columnName
                OPTIONAL MATCH path = (upstream:Field)-[:REFERENCES_FIELD*1..5]->(focus)
                WITH focus, focusEntity, collect(DISTINCT upstream) AS upstreamFields
                UNWIND upstreamFields AS uf
                OPTIONAL MATCH (uf)<-[:HAS_FIELD]-(ue:Entity)
                RETURN focus.name AS focusColumn, focusEntity.name AS focusTable,
                       collect(DISTINCT {table: ue.name, column: uf.name}) AS upstream
            `, { tableName, columnName, connectionId })
        );

        const downstream = downstreamResult.records[0]?.get("downstream")?.filter((n: any) => n?.table) ?? [];
        const upstream = upstreamResult.records[0]?.get("upstream")?.filter((n: any) => n?.table) ?? [];

        return {
            focus: { table: tableName, column: columnName },
            upstream,
            downstream,
            affectedCount: upstream.length + downstream.length,
        };
    } catch {
        return {
            focus: { table: tableName, column: columnName },
            upstream: [],
            downstream: [],
            affectedCount: 0,
        };
    } finally {
        await session.close();
    }
}

/**
 * Returns all column-level FK edges for a connection (from Neo4j graph).
 */
export async function getColumnLevelEdges(connectionId: string): Promise<ColumnLineageEdge[]> {
    const session = getSession();
    try {
        const result = await session.executeRead((tx: any) =>
            tx.run(`
                MATCH (src:Field)-[:REFERENCES_FIELD]->(tgt:Field)
                WHERE src.connectionId = $connectionId
                MATCH (src)<-[:HAS_FIELD]-(srcEntity:Entity)
                MATCH (tgt)<-[:HAS_FIELD]-(tgtEntity:Entity)
                RETURN srcEntity.name AS sourceTable, src.name AS sourceColumn,
                       tgtEntity.name AS targetTable, tgt.name AS targetColumn
            `, { connectionId })
        );

        return result.records.map((r: any) => ({
            sourceTable: r.get("sourceTable"),
            sourceColumn: r.get("sourceColumn"),
            targetTable: r.get("targetTable"),
            targetColumn: r.get("targetColumn"),
        }));
    } catch {
        return [];
    } finally {
        await session.close();
    }
}
