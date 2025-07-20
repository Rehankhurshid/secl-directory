import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../database/schema';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create PostgreSQL connection for Supabase with optimized pooling
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required');
}

const sql = postgres(connectionString, {
  // Increase connection pool size
  max: 10, // Increased from 3 to handle multiple parallel queries
  // Connection timeout settings
  idle_timeout: 30, // Increased to reduce connection churn
  connect_timeout: 10, // Keep reasonable timeout
  // Connection lifecycle
  max_lifetime: 60 * 60, // 1 hour max lifetime
  // SSL and security
  ssl: 'require', // Supabase requires SSL
  // Performance optimizations
  transform: postgres.camel, // Convert snake_case to camelCase
  connection: {
    application_name: 'secl-directory',
  },
  // Reduce logging overhead
  debug: false,
  // Connection pool optimization
  prepare: false, // Disable prepared statements for better compatibility
  target_session_attrs: 'read-write', // Ensure we get writeable connections
});

export const db = drizzle(sql, { schema });

// Export the sql instance for cleanup if needed
export { sql };

// Export all schema for easy access
export * from '../database/schema'; 