"use server";

import { db } from "../db";
import { entities, fields, relationships } from "../db/schema";
import { revalidatePath } from "next/cache";

import { eq } from "drizzle-orm";

export async function syncTableMetadata(connectionId: string, parsedTables: any[]) {
    try {
        const entityMap = new Map<string, string>();
        const fieldMap = new Map<string, string>(); // Key: "tableName.columnName", Value: field.id

        // Fetch existing data to prevent duplicates
        const existingEntitiesResult = await db.select().from(entities).where(eq(entities.connectionId, connectionId));

        // Build map of existing entities
        existingEntitiesResult.forEach(e => {
            entityMap.set(e.name, e.id);
        });

        // 1. Insert/Reuse Entities
        for (const table of parsedTables) {
            if (!table.name) continue;

            if (!entityMap.has(table.name)) {
                const entityId = crypto.randomUUID();
                await db.insert(entities).values({
                    id: entityId,
                    connectionId,
                    name: table.name,
                });
                entityMap.set(table.name, entityId);
            }
        }

        const allForeignKeys: any[] = [];

        // Fetch existing fields for these entities to prevent duplicates
        const existingFieldsResult = await db.select().from(fields);
        existingFieldsResult.forEach(f => {
            // Find which table name this field belongs to
            const parentEntity = existingEntitiesResult.find(e => e.id === f.entityId);
            if (parentEntity) {
                fieldMap.set(`${parentEntity.name}.${f.name}`, f.id);
            }
        });

        // 2. Insert/Reuse Fields (Columns)
        for (const table of parsedTables) {
            const entityId = entityMap.get(table.name);
            if (!entityId || !table.columns) continue;

            for (const col of table.columns) {
                if (!col || typeof col !== 'object') continue;

                const columnKey = `${table.name}.${col.column_name}`;
                let fieldId = fieldMap.get(columnKey);

                if (!fieldId) {
                    fieldId = crypto.randomUUID();
                    await db.insert(fields).values({
                        id: fieldId,
                        entityId,
                        name: col.column_name,
                        type: col.data_type,
                        isNullable: col.is_nullable === 'YES',
                        isPrimaryKey: col.is_primary_key || false,
                    });
                    fieldMap.set(columnKey, fieldId);
                } else {
                    // Optionally update field if schema drifted
                    await db.update(fields).set({
                        type: col.data_type,
                        isNullable: col.is_nullable === 'YES',
                        isPrimaryKey: col.is_primary_key || false,
                    }).where(eq(fields.id, fieldId));
                }

                if (col.is_foreign_key && col.foreign_table_name && col.foreign_column_name) {
                    allForeignKeys.push({
                        tempSourceFieldId: fieldId,
                        sourceColumnName: col.column_name,
                        sourceTableName: table.name,
                        targetTableName: col.foreign_table_name,
                        targetColumnName: col.foreign_column_name,
                    });
                }
            }
        }

        // Fetch existing relationships
        const existingRelsResult = await db.select().from(relationships);

        // 3. Insert/Reuse Relationships
        for (const fk of allForeignKeys) {
            const targetFieldId = fieldMap.get(`${fk.targetTableName}.${fk.targetColumnName}`);

            if (!targetFieldId) {
                console.warn(`Foreign key skipped: Could not resolve target field -> ${fk.targetTableName}.${fk.targetColumnName}`);
                continue;
            }

            // Check if relationship exists
            const relExists = existingRelsResult.some(
                r => r.sourceFieldId === fk.tempSourceFieldId && r.targetFieldId === targetFieldId
            );

            if (!relExists) {
                await db.insert(relationships).values({
                    id: crypto.randomUUID(),
                    sourceFieldId: fk.tempSourceFieldId,
                    targetFieldId: targetFieldId,
                });
            }
        }

        revalidatePath(`/dashboard/tables/${connectionId}`);
        return { success: true };

    } catch (error: any) {
        console.error("Failed to sync table metadata:", error);
        return { success: false, error: error.message };
    }
}
