import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

async function run() {
    try {
        await qdrant.search("database_schemas", {
            vector: Array(1024).fill(0.1),
            limit: 5,
            filter: {
                must: [{ key: "connection_id", match: { value: "test" } }]
            },
        });
        console.log("Mock search successful");
    } catch (e: any) {
        console.error("Error status:", e?.status);
        console.error("Error response data:", JSON.stringify(e?.data, null, 2));
    }
}
run();
