# 🔧 Vercel Login Error Debug Checklist

## Common Causes & Solutions

### 1. Database Connection Issues

**Check in Vercel Dashboard:**
1. Go to your project → Settings → Environment Variables
2. Verify these are set EXACTLY as shown (including special characters):

```env
DATABASE_URL=postgresql://postgres.edxaomipjyqsldcbwaxr:yKMJf@FP%23Hxk6C9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require

DIRECT_URL=postgresql://postgres.edxaomipjyqsldcbwaxr:yKMJf@FP%23Hxk6C9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

**Important**: The password contains special characters (`@FP#`) that must be URL-encoded as `@FP%23`

### 2. Missing Drizzle Schema Files

The build might be missing generated Drizzle files. Let's fix this:

1. Update `package.json` build script:
```json
"build": "npm run db:generate && next build"
```

2. Or add to `vercel.json`:
```json
{
  "buildCommand": "npm run db:generate && npm run build"
}
```

### 3. Check Vercel Function Logs

1. Go to Vercel Dashboard
2. Functions tab → View logs
3. Look for specific error messages when login fails

### 4. Quick Fix - Add Database Error Handling

Create `/src/app/api/auth/login/route.ts` with better error handling:

```typescript
// Add at the top of the route
try {
  // Test database connection
  await db.select().from(employees).limit(1);
} catch (dbError) {
  console.error('Database connection failed:', dbError);
  return NextResponse.json(
    { error: 'Database connection failed. Please check configuration.' },
    { status: 500 }
  );
}
```

### 5. Environment Variables Checklist

Make sure ALL these are set in Vercel:

- [ ] `DATABASE_URL` - With proper encoding
- [ ] `DIRECT_URL` - Same as DATABASE_URL
- [ ] `NEXTAUTH_SECRET` - Your generated secret
- [ ] `JWT_SECRET` - Same as NEXTAUTH_SECRET
- [ ] `ENCRYPTION_KEY` - Your generated key
- [ ] `NODE_ENV` - Set to "production"

### 6. Test Database Connection Locally

```bash
# Test with production database URL
DATABASE_URL="your-production-url" npm run db:studio
```

### 7. Redeploy After Fixes

After making changes:
1. Go to Vercel Dashboard
2. Deployments → Redeploy
3. Choose "Redeploy with existing Build Cache" = NO

## Quick Solution

The most likely issue is the DATABASE_URL encoding. Make sure:
1. The `#` in the password is encoded as `%23`
2. No extra spaces or quotes in the environment variable
3. The URL is one continuous string

## If Still Failing

Check Supabase:
1. Go to Supabase Dashboard
2. Settings → Database
3. Verify connection pooler is enabled
4. Check if database is accepting connections