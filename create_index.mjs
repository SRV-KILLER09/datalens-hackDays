import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

async function run() {
    console.log("Applying payload index to schema_documentation_mxbai...");
    try {
        await qdrant.createPayloadIndex("schema_documentation_mxbai", {
            field_name: "connection_id",
            field_schema: "keyword"
        });
        console.log("Success! Payload Index created.");
    } catch (e: any) {
        console.error("Payload Index creation failed (it may already exist):", e?.data || e);
    }
}
run();
