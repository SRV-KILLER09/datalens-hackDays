"use server";

import { db } from "../db";
import { savedQueries } from "../db/schema";
import { eq, and, desc } from "drizzle-orm";

export type SavedQuery = {
  id: string;
  connectionId: string;
  title: string;
  naturalLanguage?: string | null;
  sql: string;
  tags: string[];
  isFavorite: boolean;
  createdAt: string;
  updatedAt: string;
};

function parseTags(tags: string | null): string[] {
  if (!tags) return [];
  try {
    const parsed = JSON.parse(tags);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return tags.split(",").map((t) => t.trim()).filter(Boolean);
  }
}

function toSavedQuery(row: typeof savedQueries.$inferSelect): SavedQuery {
  return {
    id: row.id,
    connectionId: row.connectionId,
    title: row.title,
    naturalLanguage: row.naturalLanguage,
    sql: row.sql,
    tags: parseTags(row.tags),
    isFavorite: row.isFavorite,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listSavedQueries(userId: string, connectionId: string) {
  try {
    const rows = await db
      .select()
      .from(savedQueries)
      .where(and(eq(savedQueries.userId, userId), eq(savedQueries.connectionId, connectionId)))
      .orderBy(desc(savedQueries.isFavorite), desc(savedQueries.updatedAt));

    return { success: true, data: rows.map(toSavedQuery) };
  } catch (error: any) {
    return { success: false, error: error.message, data: [] as SavedQuery[] };
  }
}

export async function saveQuery(
  userId: string,
  input: {
    connectionId: string;
    title: string;
    sql: string;
    naturalLanguage?: string;
    tags?: string[];
    isFavorite?: boolean;
  }
) {
  try {
    const [row] = await db
      .insert(savedQueries)
      .values({
        userId,
        connectionId: input.connectionId,
        title: input.title,
        sql: input.sql,
        naturalLanguage: input.naturalLanguage ?? null,
        tags: JSON.stringify(input.tags ?? []),
        isFavorite: input.isFavorite ?? false,
        updatedAt: new Date(),
      })
      .returning();

    return { success: true, data: toSavedQuery(row) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function updateSavedQuery(
  userId: string,
  id: string,
  updates: { title?: string; tags?: string[]; isFavorite?: boolean; sql?: string }
) {
  try {
    const [row] = await db
      .update(savedQueries)
      .set({
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.sql !== undefined && { sql: updates.sql }),
        ...(updates.tags !== undefined && { tags: JSON.stringify(updates.tags) }),
        ...(updates.isFavorite !== undefined && { isFavorite: updates.isFavorite }),
        updatedAt: new Date(),
      })
      .where(and(eq(savedQueries.id, id), eq(savedQueries.userId, userId)))
      .returning();

    if (!row) return { success: false, error: "Query not found." };
    return { success: true, data: toSavedQuery(row) };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function deleteSavedQuery(userId: string, id: string) {
  try {
    await db
      .delete(savedQueries)
      .where(and(eq(savedQueries.id, id), eq(savedQueries.userId, userId)));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
