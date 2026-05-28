import neo4j, { Driver } from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'neo4j://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'password';

// Ensure we only have one driver instance initialized during hot-reloads in Next.js development
const globalForNeo4j = globalThis as unknown as {
    neo4jDriver: Driver | undefined
}

export const driver = globalForNeo4j.neo4jDriver ?? neo4j.driver(
    NEO4J_URI,
    neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD),
    {
        maxConnectionPoolSize: 50,
        connectionTimeout: 10000, // 10 seconds
    }
)

if (process.env.NODE_ENV !== 'production') globalForNeo4j.neo4jDriver = driver

/**
 * Helper to get a Neo4j session safely
 * @param database Optional database name (defaults to default database via empty string)
 */
export const getSession = (database?: string) => {
    return database ? driver.session({ database }) : driver.session();
}
