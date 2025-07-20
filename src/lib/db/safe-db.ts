// Safe database wrapper for production deployment
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../database/schema';

let db: ReturnType<typeof drizzle> | null = null;
let sql: ReturnType<typeof postgres> | null = null;

// Only initialize database if DATABASE_URL is available
if (process.env.DATABASE_URL) {
  try {
    sql = postgres(process.env.DATABASE_URL, {
      max: 10,
      idle_timeout: 30,
      connect_timeout: 10,
      max_lifetime: 60 * 60,
      ssl: 'require',
      transform: postgres.camel,
      connection: {
        application_name: 'secl-directory',
      },
      debug: false,
      prepare: false,
      target_session_attrs: 'read-write',
    });
    
    db = drizzle(sql, { schema });
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
}

// Export safe db that can be null
export { db, sql };
export * from '../database/schema';