# Vercel + Supabase Connection Fix

## Problem
- Next.js app worked locally but failed on Vercel with "internal server error"
- Database connection errors: `ENOTFOUND` and `ENETUNREACH`
- Both IPv4 direct connection and IPv6 addresses failed from Vercel servers

## Root Cause
Vercel's serverless functions cannot reliably connect to Supabase using **direct database connections** due to:
- Network routing limitations
- IPv6 resolution issues  
- Connection pooling requirements for serverless environments

## Solution
Use **Supabase Connection Pooler** instead of direct connection:

### ❌ Direct Connection (Failed)
```
postgresql://postgres:password@db.project.supabase.co:5432/postgres
```

### ✅ Connection Pooler (Success)
```
postgresql://postgres.project:password@aws-region.pooler.supabase.com:6543/postgres?sslmode=require
```

## Key Changes
- **Port**: 5432 → 6543
- **Host**: `db.project.supabase.co` → `aws-region.pooler.supabase.com`  
- **Username**: `postgres` → `postgres.project_id`
- **SSL**: Always include `?sslmode=require`

## Verification
- MCP Supabase integration confirmed project was `ACTIVE_HEALTHY`
- Connection pooler resolved all Vercel deployment issues
- Full database functionality restored in production

## Lesson
Always use connection pooler URLs for serverless deployments with Supabase.