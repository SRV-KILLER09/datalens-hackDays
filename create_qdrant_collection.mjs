import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL,
    apiKey: process.env.QDRANT_API_KEY,
});

async function run() {
    console.log("Creating collection schema_documentation_mxbai...");
    try {
        await qdrant.createCollection("schema_documentation_mxbai", {
            vectors: {
                size: 1024,
                distance: "Cosine"
            }
        });
        console.log("Success! Collection created.");
    } catch (e: any) {
        console.error("Creation failed:", e);
    }
}
run();
