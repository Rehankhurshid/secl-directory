import { db } from "../db";
import { log } from "../vite";
import { sql } from "drizzle-orm";

export class DatabaseInitService {
  async initializeDatabase(): Promise<void> {
    try {
      log("Starting database initialization...", "db-init");

      // Test database connection
      await db.execute(sql`SELECT 1`);
      log("Database connection successful", "db-init");

      // Check if tables exist by querying for a known table
      try {
        await db.execute(sql`SELECT COUNT(*) FROM employees LIMIT 1`);
        log(
          "Database tables already exist, skipping initialization",
          "db-init"
        );
        return;
      } catch (error) {
        log("Tables don't exist, creating schema...", "db-init");
      }

      // Create all tables using raw SQL (Drizzle schema creation)
      await this.createTables();

      log("Database schema created successfully", "db-init");
    } catch (error) {
      log(`Database initialization failed: ${error}`, "db-init");
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    // Create employees table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS employees (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE,
        phone VARCHAR(255),
        department VARCHAR(255),
        designation VARCHAR(255),
        location VARCHAR(255),
        joining_date DATE,
        employee_code VARCHAR(255),
        reporting_manager VARCHAR(255),
        category VARCHAR(255),
        grade VARCHAR(255),
        gender VARCHAR(255),
        blood_group VARCHAR(255),
        date_of_birth DATE,
        profile_image_url TEXT,
        address TEXT,
        emergency_contact VARCHAR(255),
        skills TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create auth_sessions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id VARCHAR(255) PRIMARY KEY,
        employee_id VARCHAR(255) NOT NULL,
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

    // Create otp_verifications table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS otp_verifications (
        id VARCHAR(255) PRIMARY KEY,
        session_id VARCHAR(255) NOT NULL,
        otp_code VARCHAR(255) NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create groups table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS groups (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_by VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (created_by) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

    // Create group_members table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS group_members (
        id VARCHAR(255) PRIMARY KEY,
        group_id VARCHAR(255) NOT NULL,
        employee_id VARCHAR(255) NOT NULL,
        added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        UNIQUE(group_id, employee_id)
      )
    `);

    // Create messages table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS messages (
        id VARCHAR(255) PRIMARY KEY,
        group_id VARCHAR(255) NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
        FOREIGN KEY (sender_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

    // Create push_subscriptions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        id VARCHAR(255) PRIMARY KEY,
        employee_id VARCHAR(255) NOT NULL,
        endpoint TEXT NOT NULL UNIQUE,
        token TEXT NOT NULL,
        type VARCHAR(255) NOT NULL DEFAULT 'fcm',
        device_info JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE
      )
    `);

    // Create permissions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS permissions (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        resource VARCHAR(255) NOT NULL,
        action VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create roles table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS roles (
        id VARCHAR(255) PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create role_permissions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id VARCHAR(255) PRIMARY KEY,
        role_id VARCHAR(255) NOT NULL,
        permission_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
        UNIQUE(role_id, permission_id)
      )
    `);

    // Create user_roles table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_roles (
        id VARCHAR(255) PRIMARY KEY,
        employee_id VARCHAR(255) NOT NULL,
        role_id VARCHAR(255) NOT NULL,
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        assigned_by VARCHAR(255),
        FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
        FOREIGN KEY (assigned_by) REFERENCES employees(id),
        UNIQUE(employee_id, role_id)
      )
    `);

    log("All database tables created successfully", "db-init");
  }
}

export const dbInitService = new DatabaseInitService();
