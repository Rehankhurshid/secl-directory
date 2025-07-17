import dotenv from "dotenv";
dotenv.config();

import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

// Optimize pool configuration for better performance and reliability
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10, // Reduced maximum connections for better stability
  idleTimeoutMillis: 20000, // Reduced idle timeout
  connectionTimeoutMillis: 10000, // Increased connection timeout
  maxUses: 7500, // Refresh connections after 7500 queries
  allowExitOnIdle: false, // Keep pool alive
});

export const db = drizzle(pool, { schema });

// Schedule periodic cleanup of expired sessions and OTP verifications
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes

setInterval(async () => {
  try {
    const { storage } = await import("./storage");
    // Add timeout to cleanup operations
    await Promise.race([
      Promise.all([
        storage.cleanupExpiredSessions(),
        storage.cleanupExpiredOtpVerifications(),
      ]),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Cleanup timeout")), 10000)
      ),
    ]);
  } catch (error) {
    console.error("Cleanup error:", error);
  }
}, CLEANUP_INTERVAL);
