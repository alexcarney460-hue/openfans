import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Disable prefetch as it is not supported for "Transaction" pool mode
const connectionString = process.env.DATABASE_URL ?? '';
const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client);
