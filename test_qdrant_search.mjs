import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

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
        fs.writeFileSync('qdrant_error.txt', "Success!");
    } catch (e: any) {
        fs.writeFileSync('qdrant_error.txt', JSON.stringify({
            status: e?.status,
            data: e?.data
        }, null, 2));
    }
}
run();
