"use server";

import { db } from "../db";
import { connections } from "../db/schema";
import { revalidatePath } from "next/cache";
import { eq, and, sql } from "drizzle-orm";

// --- Lazy Loader Helpers (Prevents Client-Side Bundle Errors) ---
const getPostgres = async () => (await import('postgres')).default;
const getMySQL = async () => (await import('mysql2/promise')).default;
const getSnowflake = async () => (await import('snowflake-sdk')).default;

async function executeQuery(uri: string, sqlText: string) {
  if (uri.startsWith('postgres')) {
    const postgres = await getPostgres();
    const sqlConnection = postgres(uri, { max: 1 });
    try {
      return await sqlConnection.unsafe(sqlText);
    } finally {
      await sqlConnection.end();
    }
  }
  return [];
}

export async function getDatabaseMetadata(connectionString: string) {
  const uri = connectionString?.trim();
  if (!uri) return { success: false, error: "Connection string is required." };

  if (uri.startsWith('postgres')) {
    const postgres = await getPostgres();
    const sqlConnection = postgres(uri, { max: 1, connect_timeout: 10 });
    try {
      const schemaInfo = await sqlConnection`
        SELECT 
            c.table_name, 
            c.column_name, 
            c.data_type,
            c.is_nullable,
            CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key,
            CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END AS is_foreign_key,
            fk.foreign_table_name,
            fk.foreign_column_name
        FROM information_schema.columns c
        LEFT JOIN (
            SELECT kcu.table_name, kcu.column_name
            FROM information_schema.table_constraints tco
            JOIN information_schema.key_column_usage kcu 
              ON kcu.constraint_name = tco.constraint_name 
             AND kcu.constraint_schema = tco.constraint_schema
            WHERE tco.constraint_type = 'PRIMARY KEY' AND tco.table_schema = 'public'
        ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
        LEFT JOIN (
             SELECT
                tc.table_name, kcu.column_name,
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name
            FROM information_schema.table_constraints AS tc
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
        ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
        WHERE c.table_schema = 'public'
        ORDER BY c.table_name, c.ordinal_position;
      `;
      const counts = await sqlConnection`
        SELECT relname AS table_name, n_live_tup AS row_count 
        FROM pg_stat_user_tables;
      `;
      return { success: true, data: { schema: schemaInfo, counts: counts } };
    } catch (error: any) {
      return { success: false, error: `Postgres Error: ${error.message}` };
    } finally {
      await sqlConnection.end();
    }
  }

  if (uri.startsWith('mysql')) {
    const mysql = await getMySQL();
    let connection;
    try {
      connection = await mysql.createConnection(uri);
      const [schemaInfo]: any = await connection.execute(`
        SELECT TABLE_NAME as table_name, COLUMN_NAME as column_name, DATA_TYPE as data_type
        FROM information_schema.columns
        WHERE table_schema = DATABASE()
        ORDER BY table_name, ordinal_position;
      `);
      const [counts]: any = await connection.execute(`
        SELECT TABLE_NAME as table_name, TABLE_ROWS as row_count
        FROM information_schema.tables
        WHERE table_schema = DATABASE();
      `);
      return { success: true, data: { schema: schemaInfo, counts: counts } };
    } catch (error: any) {
      return { success: false, error: `MySQL Error: ${error.message}` };
    } finally {
      if (connection) await connection.end();
    }
  }

  if (uri.startsWith('snowflake')) {
    const snowflake = await getSnowflake();
    try {
      const url = new URL(uri);
      const connection = snowflake.createConnection({
        account: url.hostname,
        username: decodeURIComponent(url.username),
        password: decodeURIComponent(url.password),
        database: url.pathname.split('/')[1],
        schema: url.pathname.split('/')[2] || 'PUBLIC',
        warehouse: url.searchParams.get('warehouse') || undefined
      });

      const connect = () => new Promise((res, rej) => connection.connect((err, conn) => err ? rej(err) : res(conn)));
      const execute = (sqlText: string) => new Promise((res, rej) => {
        connection.execute({ sqlText, complete: (err, stmt, rows) => err ? rej(err) : res(rows) });
      });

      await connect();
      const schemaInfo: any = await execute(`SELECT table_name, column_name, data_type FROM information_schema.columns ORDER BY table_name`);
      const counts: any = await execute(`SELECT table_name, row_count FROM information_schema.tables`);

      return { success: true, data: { schema: schemaInfo, counts: counts } };
    } catch (error: any) {
      return { success: false, error: `Snowflake Error: ${error.message}` };
    }
  }

  return { success: false, error: "Unsupported provider." };
}

export async function getDatabaseRelations(uri: string) {
  try {
    const metadata = await getDatabaseMetadata(uri);
    if (!metadata.success || !metadata.data) return metadata;

    const relQuery = `
      SELECT
          tc.table_name AS source_table, 
          kcu.column_name AS source_column, 
          ccu.table_name AS target_table,
          ccu.column_name AS target_column
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public';
    `;

    const relations = await executeQuery(uri, relQuery);

    return { 
      success: true, 
      data: { 
        schema: metadata.data.schema, 
        relations: relations 
      } 
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getTableDetails(connectionString: string, tableName: string) {
  const postgres = await getPostgres();
  const sqlConnection = postgres(connectionString, { max: 1, connect_timeout: 10 });
  try {
    const columns = await sqlConnection`
      SELECT column_name as name, data_type as type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = ${tableName} AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;
    return { success: true, data: columns };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    await sqlConnection.end();
  }
}

export async function getSingleTableDetails(connectionString: string, tableName: string) {
  const postgres = await getPostgres();
  const sqlConnection = postgres(connectionString, { max: 1 });
  try {
    const columns = await sqlConnection`
      SELECT 
          c.table_name, 
          c.column_name as name, 
          c.data_type as type,
          c.is_nullable,
          c.column_default,
          CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END AS is_primary_key,
          CASE WHEN fk.column_name IS NOT NULL THEN true ELSE false END AS is_foreign_key,
          fk.foreign_table_name,
          fk.foreign_column_name
      FROM information_schema.columns c
      LEFT JOIN (
          SELECT kcu.table_name, kcu.column_name
          FROM information_schema.table_constraints tco
          JOIN information_schema.key_column_usage kcu 
            ON kcu.constraint_name = tco.constraint_name 
           AND kcu.constraint_schema = tco.constraint_schema
          WHERE tco.constraint_type = 'PRIMARY KEY' AND tco.table_schema = 'public'
      ) pk ON c.table_name = pk.table_name AND c.column_name = pk.column_name
      LEFT JOIN (
           SELECT
              tc.table_name, kcu.column_name,
              ccu.table_name AS foreign_table_name,
              ccu.column_name AS foreign_column_name
          FROM information_schema.table_constraints AS tc
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name AND ccu.table_schema = tc.table_schema
          WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
      ) fk ON c.table_name = fk.table_name AND c.column_name = fk.column_name
      WHERE c.table_name = ${tableName} AND c.table_schema = 'public'
      ORDER BY c.ordinal_position;
    `;
    return { success: true, data: columns };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    await sqlConnection.end();
  }
}

export async function getTableRows(connectionString: string, tableName: string, page = 1, pageSize = 50) {
  const postgres = await getPostgres();
  const sqlConnection = postgres(connectionString, { max: 1 });
  const offset = (page - 1) * pageSize;
  try {
    const data = await sqlConnection.unsafe(`SELECT * FROM ${tableName} LIMIT ${pageSize} OFFSET ${offset}`);
    return { success: true, data };
  } catch (error: any) {
    return { success: false, error: error.message };
  } finally {
    await sqlConnection.end();
  }
}

export const getDbInventory = async () => {
  try {
    const tables = await db.execute(sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`);
    const columns = await db.execute(sql`SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name`);
    return { tables: tables.rows, columns: columns.rows };
  } catch (error) {
    throw new Error("Failed to fetch schema");
  }
};

export const getConnectionStringById = async (id: string, userId: string) => {
  try {
    const [conn] = await db
      .select({ tableUri: connections.tableUri })
      .from(connections)
      .where(and(eq(connections.id, id), eq(connections.userId, userId)))
      .limit(1);
    return conn?.tableUri || null;
  } catch (error) {
    return null;
  }
};

export const getSchemaDocumentation = async (connectionId: string, userId: string) => {
  try {
    const connString = await getConnectionStringById(connectionId, userId);
    if (!connString) {
      return { success: false, error: "Unauthorized or connection not found." };
    }

    const { schemaKnowledge } = await import('../db/schema');
    const docs = await db
      .select({
        tableName: schemaKnowledge.entityName,
        content: schemaKnowledge.markdownContent,
        updatedAt: schemaKnowledge.updatedAt
      })
      .from(schemaKnowledge)
      .where(eq(schemaKnowledge.connectionId, connectionId))
      .orderBy(schemaKnowledge.entityName);

    return { success: true, data: docs };
  } catch (error: any) {
    console.error("Failed to fetch schema documentation:", error);
    return { success: false, error: error.message };
  }
};

export const saveConnection = async (values: {
  userId: string;
  name: string;
  provider: string;
  uri: string;
}) => {
  try {
    const [existingConn] = await db
      .select({ id: connections.id })
      .from(connections)
      .where(and(eq(connections.userId, values.userId), eq(connections.tableUri, values.uri)))
      .limit(1);

    if (existingConn) return { success: true, id: existingConn.id, alreadyExists: true };

    const newId = crypto.randomUUID();
    await db.insert(connections).values({
      id: newId,
      userId: values.userId,
      name: values.name,
      provider: values.provider,
      tableUri: values.uri,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/tables");
    return { success: true, id: newId, alreadyExists: false };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getUserConnections = async (userId: string) => {
  try {
    const userConns = await db.select().from(connections).where(eq(connections.userId, userId));
    return { success: true, data: userConns };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export async function getTableQuality(connectionString: string, tableName: string, columns: any[]) {
  const postgres = await getPostgres();
  const sql = postgres(connectionString, { max: 1 });

  try {
    const projections = columns.map(col => {
      const name = col.column_name || col.name;
      const type = (col.data_type || col.type).toLowerCase();
      const isNumeric = ['integer', 'numeric', 'real', 'double precision', 'bigint', 'decimal'].some(t => type.includes(t));

      return `
        COUNT("${name}") as "${name}_count",
        COUNT(DISTINCT "${name}") as "${name}_unique"
        ${isNumeric ? `, AVG("${name}")::float as "${name}_avg"` : ''}
      `;
    }).join(', ');

    const [stats] = await sql.unsafe(`SELECT COUNT(*) as total_rows, ${projections} FROM ${tableName}`);

    const metrics = columns.map(col => {
      const name = col.column_name || col.name;
      const count = Number(stats[`${name}_count`]);
      const total = Number(stats.total_rows);

      return {
        column: name,
        type: col.data_type || col.type,
        completeness: total > 0 ? (count / total) * 100 : 0,
        uniqueness: total > 0 ? (Number(stats[`${name}_unique`]) / total) * 100 : 0,
        avg: stats[`${name}_avg`] ?? null
      };
    });

    return { success: true, data: { totalRows: stats.total_rows, metrics } };
  } catch (e: any) {
    return { success: false, error: e.message };
  } finally {
    await sql.end();
  }
}

export async function deleteConnection(connectionId: string, userId: string) {
  try {
    const result = await db.delete(connections).where(and(eq(connections.id, connectionId), eq(connections.userId, userId))).returning({ deletedId: connections.id });
    if (result.length === 0) return { success: false, error: "Unauthorized." };
    revalidatePath("/dashboard/connections");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function runCustomQuery(connectionId: string, userId: string | undefined, sqlText: string) {
  try {
    const FALLBACK_URI = process.env.NEXT_PUBLIC_FALLBACK_URI!;
    
    let uri = "";
    if (connectionId === "demo-neon-db" || !userId) {
      uri = FALLBACK_URI;
    } else {
      uri = await getConnectionStringById(connectionId, userId) || FALLBACK_URI;
    }

    if (!uri) throw new Error("Connection not found");

    if (uri.startsWith('postgres')) {
      const postgres = await getPostgres();
      const sqlConnection = postgres(uri, { max: 1 });
      try {
        const result = await sqlConnection.unsafe(sqlText);
        return { success: true, data: JSON.parse(JSON.stringify(result)) };
      } finally {
        await sqlConnection.end();
      }
    }
    
    return { success: false, error: "Only PostgreSQL is supported for custom queries at this time." };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function analyzeImpactAction(query: string) {
  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("GROQ_API_KEY is not configured on the server.");
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "system",
            content: "Analyze the provided SQL query. Identify table relationships as a graph. Determine the 'depth' (number of joins/hops). Provide a JSON response: { \"depth\": number, \"relations\": [\"tableA -> tableB\"], \"impact\": \"description\" }"
          },
          { role: "user", content: query }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Groq API Error");
    }

    if (data.choices && data.choices.length > 0) {
      return { success: true, data: JSON.parse(data.choices[0].message.content) };
    }
    
    return { success: false, error: "No analysis generated from Groq." };
  } catch (err: any) {
    console.error("Groq Analysis Failed", err);
    return { success: false, error: err.message || "Groq Analysis Failed" };
  }
}
