import { db } from './src/db/index.js';
import { sql } from 'drizzle-orm';

async function migrate() {
    console.log("Creating schema_doc_images table if it does not exist...");

    const executeSql = `
        CREATE TABLE IF NOT EXISTS schema_doc_images (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            connection_id TEXT NOT NULL,
            entity_name TEXT NOT NULL,
            page_number INT NOT NULL,
            image_path TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX IF NOT EXISTS doc_images_conn_entity_idx 
        ON schema_doc_images (connection_id, entity_name);
    `;

    try {
        await db.execute(sql.raw(executeSql));
        console.log("Migration successful.");
    } catch (e) {
        console.error("Migration failed:", e);
    } process.exit(0);
}

migrate();
