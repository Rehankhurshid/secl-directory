# 🔧 Fix DATABASE_URL in Vercel

## The Issue
The password `yKMJf@FP#Hxk6C9` contains special characters that need URL encoding:
- `@` stays as `@` (it's valid in passwords)
- `#` must be encoded as `%23`

## Quick Fix - Manual Steps

1. **Go to Vercel Dashboard**
   - https://vercel.com/dashboard
   - Select your `coal-india-app` project
   - Go to Settings → Environment Variables

2. **Update DATABASE_URL**
   
   Find `DATABASE_URL` and click Edit. Replace with EXACTLY this:
   ```
   postgresql://postgres.edxaomipjyqsldcbwaxr:yKMJf@FP%23Hxk6C9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

3. **Update DIRECT_URL**
   
   Find `DIRECT_URL` and click Edit. Replace with the SAME value:
   ```
   postgresql://postgres.edxaomipjyqsldcbwaxr:yKMJf@FP%23Hxk6C9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
   ```

4. **Important Notes**:
   - Do NOT add quotes around the value
   - Make sure there are no spaces before or after
   - The `#` MUST be encoded as `%23`
   - Save each variable

5. **Redeploy**
   - Go to Deployments tab
   - Click on the latest deployment
   - Click "Redeploy"
   - Choose "Use existing Build Cache" = **NO**

## Test After Deployment

1. **Health Check**:
   ```
   https://coal-india-app.vercel.app/api/health
   ```

2. **Database Test**:
   ```
   https://coal-india-app.vercel.app/api/auth/test-db
   ```

If the database test shows "Database connection successful", then login will work!

## Alternative: Use Supabase Connection String

If the above doesn't work, try using the Supabase pooler connection string from your Supabase dashboard:
1. Go to Supabase Dashboard
2. Settings → Database
3. Copy the "Connection string" (Pooler) - Transaction mode
4. Make sure it has `?sslmode=require` at the end