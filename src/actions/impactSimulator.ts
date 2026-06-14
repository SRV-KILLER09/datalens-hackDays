"use server";

import fs from "fs/promises";
import path from "path";
import { getDatabaseRelations, getConnectionStringById, analyzeImpactAction } from "./db";
import { getColumnLineage } from "./graphQueries";

const FALLBACK_URI = process.env.NEXT_PUBLIC_FALLBACK_URI || "";

export type ChangeType = "drop_table" | "drop_column" | "rename_column";

export type ImpactSimulationResult = {
  changeType: ChangeType;
  target: { table: string; column?: string; newName?: string };
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  affectedTables: string[];
  affectedColumns: { table: string; column: string; reason: string }[];
  foreignKeyImpacts: { from: string; to: string; description: string }[];
  lineage: { upstream: { table: string; column: string }[]; downstream: { table: string; column: string }[] };
  apiEndpoints: { slug: string; url: string; matchedTerms: string[] }[];
  aiAnalysis: { depth: number; relations: string[]; impact: string } | null;
  recommendations: string[];
};

async function resolveUri(connectionId: string, userId?: string) {
  if (connectionId === "demo-neon-db" || !userId) return FALLBACK_URI;
  return (await getConnectionStringById(connectionId, userId)) || FALLBACK_URI;
}

async function scanApiEndpoints(searchTerms: string[]) {
  const customDir = path.join(process.cwd(), "src/app/api/custom");
  const results: ImpactSimulationResult["apiEndpoints"] = [];

  try {
    await fs.mkdir(customDir, { recursive: true });
    const entries = await fs.readdir(customDir, { withFileTypes: true });

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const routeFile = path.join(customDir, entry.name, "route.ts");
      try {
        const code = await fs.readFile(routeFile, "utf-8");
        const matchedTerms = searchTerms.filter(
          (term) => term.length > 2 && code.toLowerCase().includes(term.toLowerCase())
        );
        if (matchedTerms.length > 0) {
          results.push({
            slug: entry.name,
            url: `/api/custom/${entry.name}`,
            matchedTerms,
          });
        }
      } catch {
        // skip unreadable routes
      }
    }
  } catch {
    // no custom endpoints dir
  }

  return results;
}

export async function getConnectionTablesAction(connectionId: string, userId?: string) {
  try {
    const uri = await resolveUri(connectionId, userId);
    if (!uri) return { success: false, error: "No connection found." };

    const res = await getDatabaseRelations(uri);
    if (!res.success || !res.data) return { success: false, error: res.error };

    const schema = res.data.schema as any[];
    const tables: Record<string, string[]> = {};

    schema.forEach((col) => {
      const table = col.table_name || col.TABLE_NAME;
      const column = col.column_name || col.COLUMN_NAME;
      if (!tables[table]) tables[table] = [];
      tables[table].push(column);
    });

    return {
      success: true,
      data: Object.entries(tables).map(([name, columns]) => ({ name, columns })),
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function simulateSchemaChangeAction(
  connectionId: string,
  userId: string | undefined,
  changeType: ChangeType,
  tableName: string,
  columnName?: string,
  newName?: string
): Promise<{ success: boolean; data?: ImpactSimulationResult; error?: string }> {
  try {
    const uri = await resolveUri(connectionId, userId);
    if (!uri) return { success: false, error: "No connection found." };

    const relRes = await getDatabaseRelations(uri);
    if (!relRes.success || !relRes.data) {
      return { success: false, error: relRes.error || "Could not load schema." };
    }

    const relData = relRes.data as { schema: unknown[]; relations?: { source_table: string; source_column: string; target_table: string; target_column: string }[] };
    const relations = relData.relations ?? [];

    const affectedTables = new Set<string>();
    const affectedColumns: ImpactSimulationResult["affectedColumns"] = [];
    const foreignKeyImpacts: ImpactSimulationResult["foreignKeyImpacts"] = [];

    if (changeType === "drop_table") {
      affectedTables.add(tableName);
      relations.forEach((rel) => {
        if (rel.source_table === tableName || rel.target_table === tableName) {
          affectedTables.add(rel.source_table);
          affectedTables.add(rel.target_table);
          foreignKeyImpacts.push({
            from: `${rel.source_table}.${rel.source_column}`,
            to: `${rel.target_table}.${rel.target_column}`,
            description:
              rel.source_table === tableName
                ? `FK from ${rel.source_table} will break (references dropped table)`
                : `FK to ${rel.target_table} will break (referenced table dropped)`,
          });
        }
      });
    } else if (changeType === "drop_column" && columnName) {
      relations.forEach((rel) => {
        if (
          (rel.source_table === tableName && rel.source_column === columnName) ||
          (rel.target_table === tableName && rel.target_column === columnName)
        ) {
          affectedTables.add(rel.source_table);
          affectedTables.add(rel.target_table);
          foreignKeyImpacts.push({
            from: `${rel.source_table}.${rel.source_column}`,
            to: `${rel.target_table}.${rel.target_column}`,
            description: `Foreign key constraint will be violated or removed`,
          });
          affectedColumns.push({
            table: rel.source_table,
            column: rel.source_column,
            reason: "Participates in FK referencing dropped column",
          });
        }
      });
      affectedColumns.push({
        table: tableName,
        column: columnName,
        reason: "Target column scheduled for deletion",
      });
    } else if (changeType === "rename_column" && columnName && newName) {
      relations.forEach((rel) => {
        if (rel.source_table === tableName && rel.source_column === columnName) {
          affectedTables.add(rel.target_table);
          foreignKeyImpacts.push({
            from: `${rel.source_table}.${columnName}`,
            to: `${rel.target_table}.${rel.target_column}`,
            description: `Outgoing FK must be updated to use '${newName}'`,
          });
        }
        if (rel.target_table === tableName && rel.target_column === columnName) {
          affectedTables.add(rel.source_table);
          foreignKeyImpacts.push({
            from: `${rel.source_table}.${rel.source_column}`,
            to: `${rel.target_table}.${columnName}`,
            description: `Incoming FK references renamed column — constraint must be recreated`,
          });
        }
      });
      affectedColumns.push({
        table: tableName,
        column: columnName,
        reason: `Will be renamed to '${newName}'`,
      });
    }

    let lineage = { upstream: [] as { table: string; column: string }[], downstream: [] as { table: string; column: string }[] };
    if (columnName && connectionId !== "demo-neon-db") {
      const lineageRes = await getColumnLineage(tableName, columnName, connectionId);
      lineage = { upstream: lineageRes.upstream ?? [], downstream: lineageRes.downstream ?? [] };
      lineage.upstream.forEach((n) => affectedTables.add(n.table));
      lineage.downstream.forEach((n) => affectedTables.add(n.table));
    } else if (columnName) {
      relations.forEach((rel) => {
        if (rel.target_table === tableName && rel.target_column === columnName) {
          lineage.upstream.push({ table: rel.source_table, column: rel.source_column });
        }
        if (rel.source_table === tableName && rel.source_column === columnName) {
          lineage.downstream.push({ table: rel.target_table, column: rel.target_column });
        }
      });
    }

    const searchTerms = [tableName, columnName, newName].filter(Boolean) as string[];
    const apiEndpoints = await scanApiEndpoints(searchTerms);

    const ddl =
      changeType === "drop_table"
        ? `DROP TABLE ${tableName};`
        : changeType === "drop_column"
          ? `ALTER TABLE ${tableName} DROP COLUMN ${columnName};`
          : `ALTER TABLE ${tableName} RENAME COLUMN ${columnName} TO ${newName};`;

    const aiRes = await analyzeImpactAction(ddl);
    const aiAnalysis = aiRes.success ? aiRes.data : null;

    const impactCount =
      foreignKeyImpacts.length + lineage.upstream.length + lineage.downstream.length + apiEndpoints.length;

    let riskLevel: ImpactSimulationResult["riskLevel"] = "LOW";
    if (changeType === "drop_table" || impactCount >= 5) riskLevel = "CRITICAL";
    else if (impactCount >= 3 || foreignKeyImpacts.length >= 2) riskLevel = "HIGH";
    else if (impactCount >= 1) riskLevel = "MEDIUM";

    const recommendations: string[] = [];
    if (foreignKeyImpacts.length > 0) {
      recommendations.push("Drop or update foreign key constraints before applying this change.");
    }
    if (lineage.downstream.length > 0) {
      recommendations.push(`Review ${lineage.downstream.length} downstream column(s) that depend on this field.`);
    }
    if (apiEndpoints.length > 0) {
      recommendations.push(`Update ${apiEndpoints.length} agent-generated API endpoint(s) that reference this object.`);
    }
    if (changeType === "rename_column") {
      recommendations.push("Search saved queries and dashboards for references to the old column name.");
    }
    if (changeType === "drop_table") {
      recommendations.push("Export table data and notify downstream consumers before dropping.");
    }
    if (recommendations.length === 0) {
      recommendations.push("Low blast radius detected. Standard change management procedures should suffice.");
    }

    const summary =
      changeType === "drop_table"
        ? `Dropping table '${tableName}' affects ${affectedTables.size} table(s), ${foreignKeyImpacts.length} FK relationship(s), and ${apiEndpoints.length} API endpoint(s).`
        : changeType === "drop_column"
          ? `Dropping '${tableName}.${columnName}' impacts ${foreignKeyImpacts.length} FK(s), ${lineage.upstream.length + lineage.downstream.length} related column(s).`
          : `Renaming '${tableName}.${columnName}' to '${newName}' requires updating ${foreignKeyImpacts.length} FK reference(s).`;

    return {
      success: true,
      data: {
        changeType,
        target: { table: tableName, column: columnName, newName },
        riskLevel,
        summary,
        affectedTables: Array.from(affectedTables),
        affectedColumns,
        foreignKeyImpacts,
        lineage,
        apiEndpoints,
        aiAnalysis,
        recommendations,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
