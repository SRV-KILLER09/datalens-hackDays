import postgres from 'postgres';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

async function migrate() {
    try {
        const sql = postgres(process.env.DATABASE_URL!);
        const query = fs.readFileSync('schema_knowledge.sql', 'utf8');
        
        console.log("Executing raw SQL migration against NeonDB...");
        await sql.unsafe(query);
        console.log("Migration completed successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Migration failed:", err);
        process.exit(1);
    }
}

migrate();
