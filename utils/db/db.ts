import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    'DATABASE_URL environment variable is not set. Cannot connect to database.'
  );
}

// Optimized for serverless: single connection, no prefetch (Transaction pool mode),
// reasonable timeouts to avoid hanging in cold starts.
const client = postgres(connectionString, {
  prepare: false,
  max: 1,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client);
