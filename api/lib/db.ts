import { neon } from '@neondatabase/serverless';

type SqlClient = ReturnType<typeof neon>;

let sqlClient: SqlClient | null = null;

function getConnectionString() {
    return process.env.NEON_DATABASE_URL || process.env.VITE_NEON_URL;
}

export function getSqlClient() {
    if (!sqlClient) {
        const connectionString = getConnectionString();
        if (!connectionString) {
            throw new Error('Missing NEON_DATABASE_URL environment variable');
        }
        sqlClient = neon(connectionString);
    }
    return sqlClient;
}

export async function query(text: string, params?: any[]) {
    const rows = await getSqlClient()(text, params);
    return { rows };
}
