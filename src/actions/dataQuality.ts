"use server";

import { getSession } from "../lib/neo4j";
import { runCustomQuery } from "./db";

export interface QualityMetric {
    type: string;
    count: number;
    affected_table: string;
    column?: string;
}

export interface HealthScore {
    table: string;
    score: number;
    status: "GOOD" | "WARNING" | "CRITICAL";
}

/**
 * Performs deterministic data quality checks for a specific table.
 */
export async function getDataQualityMetrics(tableName: string, connectionId: string, userId: string) {
    const session = getSession();
    try {
        const queries: { type: string, query: string }[] = [];
        const schemaCypher = `
        MATCH (e:Entity {name: $tableName, connectionId: $connectionId})-[:HAS_FIELD]->(f:Field)
        OPTIONAL MATCH (f)-[:REFERENCES_FIELD]->(targetF:Field)<-[:HAS_FIELD]-(targetE:Entity)
        RETURN 
          f.name AS columnName, 
          f.type AS dataType, 
          f.isNullable AS isNullable, 
          f.isPrimaryKey AS isPK,
          f.isForeignKey AS isFK,
          targetE.name AS referencesTable,
          targetF.name AS referencesColumn
      `;
        queries.push({ type: "Neo4j Schema Discovery", query: schemaCypher });

        // 1. Get Schema Context from Neo4j
        const schemaResult = await session.executeRead((tx: any) =>
            tx.run(schemaCypher, { tableName, connectionId })
        );

        const schema = schemaResult.records.map((r: any) => ({
            name: r.get('columnName'),
            type: r.get('dataType'),
            isNullable: r.get('isNullable'),
            isPrimaryKey: r.get('isPK'),
            isForeignKey: r.get('isFK'),
            referencesTable: r.get('referencesTable'),
            referencesColumn: r.get('referencesColumn')
        }));

        const results: any = {
            orphans: [],
            duplicates: [],
            nullViolations: [],
            freshness: null,
            health: null
        };

        // 2. Generate SQL for Orphans
        for (const col of schema) {
            if (col.isForeignKey && col.referencesTable) {
                const orphanSql = `
          SELECT COUNT(*)::int as count
          FROM "${tableName}" c
          LEFT JOIN "${col.referencesTable}" p ON c."${col.name}" = p."${col.referencesColumn}"
          WHERE p."${col.referencesColumn}" IS NULL AND c."${col.name}" IS NOT NULL;
        `;
                queries.push({ type: `Orphan Check (${col.name})`, query: orphanSql });
                const res = await runCustomQuery(connectionId, userId, orphanSql);
                if (res.success && res.data.length > 0) {
                    results.orphans.push({
                        type: "integrity_check",
                        orphan_count: res.data[0].count,
                        affected_table: tableName,
                        fk_column: col.name
                    });
                }
            }
        }

        // 3. Duplicate PK Check
        const pk = schema.find((c: any) => c.isPrimaryKey);
        if (pk) {
            const dupSql = `
        SELECT COUNT(*)::int as count FROM (
          SELECT "${pk.name}" FROM "${tableName}" GROUP BY "${pk.name}" HAVING COUNT(*) > 1
        ) sub;
      `;
            queries.push({ type: `PK Duplicate Check (${pk.name})`, query: dupSql });
            const res = await runCustomQuery(connectionId, userId, dupSql);
            if (res.success && res.data.length > 0) {
                results.duplicates.push({
                    type: "duplicate_check",
                    count: res.data[0].count,
                    column: pk.name
                });
            }
        }

        // 4. Null Ratio / Violation Check
        for (const col of schema) {
            if (!col.isNullable) {
                const nullSql = `
          SELECT 
            COUNT(*) FILTER (WHERE "${col.name}" IS NULL)::int as null_count,
            COUNT(*)::int as total_count
          FROM "${tableName}";
        `;
                queries.push({ type: `Null Violation Check (${col.name})`, query: nullSql });
                const res = await runCustomQuery(connectionId, userId, nullSql);
                if (res.success && res.data.length > 0) {
                    const { null_count, total_count } = res.data[0];
                    const ratio = total_count > 0 ? null_count / total_count : 0;
                    if (null_count > 0 || ratio > 0.2) {
                        results.nullViolations.push({
                            column: col.name,
                            count: null_count,
                            ratio: ratio
                        });
                    }
                }
            }
        }

        // 5. Freshness Check
        const timeCol = schema.find((c: any) => c.name.toLowerCase() === 'updated_at' || c.name.toLowerCase() === 'created_at');
        if (timeCol) {
            const freshSql = `SELECT MAX("${timeCol.name}") as last_updated FROM "${tableName}";`;
            queries.push({ type: `Freshness Check (${timeCol.name})`, query: freshSql });
            const res = await runCustomQuery(connectionId, userId, freshSql);
            if (res.success && res.data.length > 0 && res.data[0].last_updated) {
                const lastDate = new Date(res.data[0].last_updated);
                const diffDays = Math.floor((Date.now() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
                results.freshness = { freshness_days: diffDays };
            }
        }

        // 6. Health Score Computation
        let score = 100;
        const orphanPenalty = results.orphans.reduce((acc: number, o: any) => acc + (o.orphan_count > 0 ? 10 : 0), 0);
        const dupPenalty = results.duplicates.reduce((acc: number, d: any) => acc + (d.count > 0 ? 20 : 0), 0);
        const nullPenalty = results.nullViolations.length * 5;
        const stalenessPenalty = (results.freshness?.freshness_days || 0) > 30 ? 10 : 0;

        score = Math.max(0, score - orphanPenalty - dupPenalty - nullPenalty - stalenessPenalty);

        results.health = {
            table: tableName,
            score,
            status: score > 80 ? "GOOD" : score > 50 ? "WARNING" : "CRITICAL"
        };

        return { success: true, data: { ...results, executedQueries: queries } };
    } catch (err: any) {
        console.error("Data Quality Check Failed", err);
        return { success: false, error: err.message };
    } finally {
        await session.close();
    }
}

/**
 * Structural Analysis using Graph Traversal
 */
export async function getStructuralAnalysis(connectionId: string) {
    const session = getSession();
    try {
        const queries: { type: string, query: string }[] = [];

        const isolatedCypher = `
        MATCH (e:Entity {connectionId: $connectionId})
        WHERE NOT (e)-[:REFERENCES]-()
        RETURN collect(e.name) as isolated
      `;
        queries.push({ type: "Graph: Isolated Nodes", query: isolatedCypher });
        const isolatedNodesRes = await session.executeRead((tx: any) =>
            tx.run(isolatedCypher, { connectionId })
        );

        const depthCypher = `
        MATCH p = (e:Entity {connectionId: $connectionId})-[:REFERENCES*1..]->()
        RETURN max(length(p)) as maxDepth
      `;
        queries.push({ type: "Graph: Max Depth", query: depthCypher });
        const depthRes = await session.executeRead((tx: any) =>
            tx.run(depthCypher, { connectionId })
        );

        const hubsCypher = `
        MATCH (e:Entity {connectionId: $connectionId})
        WITH e, size((e)--()) as degree
        WHERE degree > 5
        RETURN collect({name: e.name, connections: degree}) as hubs
      `;
        queries.push({ type: "Graph: Central Hubs", query: hubsCypher });
        const hubsRes = await session.executeRead((tx: any) =>
            tx.run(hubsCypher, { connectionId })
        );

        return {
            success: true,
            data: {
                isolated: isolatedNodesRes.records[0].get('isolated'),
                maxDepth: depthRes.records[0].get('maxDepth')?.toInt() || 0,
                hubs: hubsRes.records[0].get('hubs'),
                executedQueries: queries
            }
        };
    } catch (err: any) {
        return { success: false, error: err.message };
    } finally {
        await session.close();
    }
}
