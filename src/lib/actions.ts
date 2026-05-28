"use server";

import { db } from "../db";
import { sql,and } from "drizzle-orm";
import { connections } from "../db/schema";
import { eq } from "drizzle-orm";

export const getDbInventory = async () => {
  try {
    const tables = await db.execute(sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);

    const columns = await db.execute(sql`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);

    return { 
        tables: tables.rows, 
        columns: columns.rows 
    };
  } catch (error) {
    console.error("Database metadata fetch failed:", error);
    throw new Error("Failed to fetch schema");
  }
};

export const getConnectionStringById = async (id: string, userId: string) => {
  try {
    const [conn] = await db
      .select({ tableUri: connections.tableUri })
      .from(connections)
      .where(
        and(
          eq(connections.id, id),
          eq(connections.userId, userId)
        )
      )
      .limit(1);

    return conn?.tableUri || null;
  } catch (error) {
    console.error("Failed to find connection string:", error);
    return null;
  }
};
export const saveConnection = async (values: {
  userId: string;
  name: string;
  provider: string;
  uri: string;
}) => {
  try {
    await db.insert(connections).values({
      id: crypto.randomUUID(), // Or whatever ID system you use
      userId: values.userId,
      name: values.name,
      provider: values.provider,
      tableUri: values.uri,
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
export const getUserConnections = async (userId: string) => {
  try {
    const userConns = await db
      .select()
      .from(connections)
      .where(eq(connections.userId, userId));

    return { success: true, data: userConns };
  } catch (error: any) {
    console.error("Failed to fetch user connections:", error);
    return { success: false, error: error.message };
  }
};