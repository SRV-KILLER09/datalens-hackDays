import { QdrantClient } from '@qdrant/js-client-rest';

export const qdrant = new QdrantClient({
    url: process.env.QDRANT_URL, // e.g., 'https://your-id.aws.cloud.qdrant.io:6333'
    apiKey: process.env.QDRANT_API_KEY,
});

export const COLLECTION_NAME = "database_schemas";