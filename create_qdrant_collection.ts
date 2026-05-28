import { QdrantClient } from '@qdrant/js-client-rest';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function createQueryCollection() {
    const qdrant = new QdrantClient({
        url: process.env.QDRANT_URL,
        apiKey: process.env.QDRANT_API_KEY,
    });

    try {
        const collections = await qdrant.getCollections();
        const exists = collections.collections.some(c => c.name === "database_schemas");

        if (!exists) {
            console.log("Collection 'database_schemas' not found. Creating...");
            await qdrant.createCollection("database_schemas", {
                vectors: {
                    size: 1024, // mixedbread-ai/mxbai-embed-large-v1 uses 1024 dimensions
                    distance: "Cosine"
                }
            });
            console.log("Collection created successfully.");
        } else {
            console.log("Collection already exists.");
        }
    } catch (e) {
        console.error("Failed to create collection:", e);
    }
}

createQueryCollection();
