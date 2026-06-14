import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    const sql = postgres(process.env.NEXT_PUBLIC_FALLBACK_URI as string);
    const res = await sql`SELECT table_schema, table_name, column_name FROM information_schema.columns WHERE column_name = 'customer_id' OR table_name LIKE '%order%'`;
    console.log(res);
    process.exit(0);
}
run().catch(console.error);
run().catch(console.error);
