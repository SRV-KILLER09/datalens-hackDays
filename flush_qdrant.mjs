import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

async function run() {
    console.log("Flushing unindexed schema_documentation_mxbai...");
    try {
        await qdrant.deleteCollection("schema_documentation_mxbai");
        console.log("Success! Collection deleted.");
    } catch (e: any) {
        console.error("Flush failed:", e);
    }
}
run();
