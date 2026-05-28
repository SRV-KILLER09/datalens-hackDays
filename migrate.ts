import postgres from 'postgres';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function migrate() {
    try {
        if (!process.env.DATABASE_URL) throw new Error("No DATABASE_URL found in .env");
        const sql = postgres(process.env.DATABASE_URL);

        console.log("Adding missing unique constraint to schema_knowledge...");

        await sql.unsafe(`ALTER TABLE schema_knowledge ADD CONSTRAINT unique_connection_entity UNIQUE(connection_id, entity_name);`);

        console.log("Constraint added successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
