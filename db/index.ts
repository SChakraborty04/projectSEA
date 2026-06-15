import { Pool } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import * as schema from "./schema";

const globalForDb = globalThis as unknown as { pool: Pool };

export const pool = globalForDb.pool || new Pool({ connectionString: process.env.DATABASE_URL, max: 10, idleTimeoutMillis: 15000 });

if (process.env.NODE_ENV !== 'production') {
    globalForDb.pool = pool;
}

export const db = drizzle({ client: pool, schema });
