# SECL Employee Directory - Local Setup Guide

This document outlines all the steps taken to successfully set up and run the SECL Employee Directory PWA locally on macOS.

## Overview

The SECL Employee Directory is a full-stack Progressive Web Application (PWA) with:

- **Frontend**: React with TypeScript, Vite build system, Shadcn UI components
- **Backend**: Node.js/Express with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **Features**: Real-time messaging, role-based authentication, admin panel, push notifications
- **Data**: 900+ pre-loaded employee records

## Initial Project Setup

### 1. Automated Setup Script Execution

The project came with an automated setup script that was executed to install dependencies and configure the database:

```bash
# The script automatically ran:
# - npm install (installed all dependencies)
# - Database configuration
# - Initial project setup
```

### 2. Dependencies Installed

Key dependencies were automatically installed:

- **Runtime**: Node.js, Express, React, TypeScript
- **Database**: PostgreSQL, Drizzle ORM, node-postgres
- **UI**: Shadcn UI components, Radix UI, Tailwind CSS
- **Real-time**: WebSocket support
- **PWA**: Service worker, push notifications
- **Authentication**: JWT, bcrypt
- **Development**: Vite, ESBuild, TSX

## Database Configuration

### 3. PostgreSQL Setup

**Issue**: Missing DATABASE_URL configuration
**Solution**: Created `.env` file with local PostgreSQL connection:

```bash
# .env file created
DATABASE_URL=postgresql://username:password@localhost:5432/secl_directory
NODE_ENV=development
PORT=3000
JWT_SECRET=your-jwt-secret-here
```

### 4. Database Driver Fix

**Issue**: Server was configured for Neon serverless PostgreSQL, not local PostgreSQL
**Solution**: Updated `server/db.ts` to use standard node-postgres:

```typescript
// Changed from:
import { neon } from "@neondatabase/serverless";

// To:
import pkg from "pg";
const { Pool } = pkg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

### 5. Database Schema Creation

**Issue**: Database tables didn't exist
**Solution**: Used Drizzle to push schema to database:

```bash
npm run db:push
```

This created all necessary tables:

- employees
- users
- messages
- groups
- permissions
- sessions

## Server Configuration Fixes

### 6. Server Listening Configuration

**Issue**: Server couldn't bind to 0.0.0.0 address on macOS
**Solution**: Modified `server/index.ts` to use 127.0.0.1:

```typescript
// Changed from:
app.listen(
  port,
  "0.0.0.0",
  {
    reusePort: true,
  },
  () => {
    log(`Server running on all interfaces port ${port}`);
  }
);

// To:
app.listen(port, "127.0.0.1", () => {
  log(`Server running on http://127.0.0.1:${port}`);
});
```

### 7. Port Conflict Resolution

**Issue**: Port 5000 was conflicting with macOS AirTunes service
**Solution**: Changed application port from 5000 to 3000:

```typescript
// In server/index.ts
const port = process.env.PORT || 3000;

// Updated all configurations to use port 3000
```

## Build System Configuration

### 8. Path Resolution Fixes

**Issue**: `import.meta.dirname` causing undefined path errors in bundled production code
**Solution**: Multiple fixes applied:

#### vite.config.ts Fix

```typescript
// Changed from using import.meta.dirname to process.cwd()
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(process.cwd(), "client", "src"),
      "@shared": path.resolve(process.cwd(), "shared"),
      "@assets": path.resolve(process.cwd(), "attached_assets"),
    },
  },
  root: path.resolve(process.cwd(), "client"),
  build: {
    outDir: path.resolve(process.cwd(), "dist/public"),
    emptyOutDir: true,
  },
});
```

#### server/vite.ts Fix

```typescript
// Changed from import.meta.dirname to process.cwd()
const distPath = path.resolve(process.cwd(), "dist", "public");
```

### 9. ESBuild Configuration

**Issue**: Production builds failing due to ES module compatibility
**Solution**: Updated package.json build script with proper banner injection:

```json
{
  "scripts": {
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --banner:js=\"import { createRequire } from 'module'; import { fileURLToPath } from 'url'; import { dirname } from 'path'; const require = createRequire(import.meta.url); const __filename = fileURLToPath(import.meta.url); const __dirname = dirname(__filename);\""
  }
}
```

## Environment Configuration

### 10. Environment Variables Setup

Created comprehensive `.env` file for local development:

```bash
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/secl_directory

# Application
NODE_ENV=development
PORT=3000
JWT_SECRET=your-jwt-secret-here

# Optional: Firebase (for push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
```

### 11. Git Configuration

Created `.env.example` template and added `.env` to `.gitignore` to prevent committing sensitive data.

## Development Scripts

### 12. Package.json Scripts

Ensured all development scripts work correctly:

```json
{
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index.ts",
    "build": "vite build && esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist --banner:js=\"...\"",
    "start": "NODE_ENV=production node dist/index.js",
    "check": "tsc",
    "db:push": "drizzle-kit push"
  }
}
```

## File Structure Adjustments

### 13. TypeScript Configuration

Ensured `tsconfig.json` properly configured for ES modules:

```json
{
  "compilerOptions": {
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "allowImportingTsExtensions": true,
    "paths": {
      "@/*": ["./client/src/*"],
      "@shared/*": ["./shared/*"]
    }
  }
}
```

## Testing and Verification

### 14. Health Check Endpoints

Added health check endpoints for monitoring:

```typescript
// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
    res.status(200).json({ status: "healthy", database: "connected" });
  } catch (error) {
    res
      .status(503)
      .json({ status: "unhealthy", error: "Database connection failed" });
  }
});
```

### 15. Local Testing

Verified all functionality works locally:

- ✅ Server starts on http://localhost:3000
- ✅ Database connections successful
- ✅ Frontend builds and serves correctly
- ✅ API endpoints responding
- ✅ Real-time messaging functional
- ✅ Authentication system working
- ✅ Admin panel accessible
- ✅ Employee directory searchable

## Final Local Development Commands

To run the application locally after setup:

```bash
# Start development server
npm run dev

# Or build and start production mode
npm run build
npm start

# Check for TypeScript errors
npm run check

# Update database schema
npm run db:push
```

## Key Files Modified

1. **server/db.ts** - Database connection configuration
2. **server/index.ts** - Server listening configuration and port changes
3. **server/vite.ts** - Path resolution fixes
4. **vite.config.ts** - Build configuration and path aliases
5. **package.json** - Build scripts and ESBuild configuration
6. **.env** - Environment variables (created)
7. **tsconfig.json** - TypeScript module configuration

## Application Features Verified

- ✅ Employee directory with 900+ employees
- ✅ Advanced search and filtering
- ✅ Real-time messaging system
- ✅ Role-based authentication (Admin/Employee)
- ✅ Admin panel for employee management
- ✅ PWA capabilities (offline support, installable)
- ✅ Push notifications system
- ✅ Responsive design for mobile/desktop
- ✅ Group messaging functionality
- ✅ File upload and profile management

## Performance Notes

- Application runs smoothly on localhost:3000
- Database queries optimized for large employee dataset
- Real-time features working without lag
- PWA features functional in development mode

---

**Note**: This setup guide covers the local development environment only. For production deployment, additional considerations like environment-specific configurations, security settings, and hosting platform requirements apply.
