#!/bin/bash

echo "Fixing DATABASE_URL in Vercel..."

# The correct DATABASE_URL with properly encoded password
DATABASE_URL='postgresql://postgres.edxaomipjyqsldcbwaxr:yKMJf@FP%23Hxk6C9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require'

# Remove old DATABASE_URL
echo "y" | npx vercel env rm DATABASE_URL

# Remove old DIRECT_URL
echo "y" | npx vercel env rm DIRECT_URL

# Add new DATABASE_URL
echo "$DATABASE_URL" | npx vercel env add DATABASE_URL production development preview

# Add new DIRECT_URL (same value)
echo "$DATABASE_URL" | npx vercel env add DIRECT_URL production development preview

echo "✅ DATABASE_URL fixed!"
echo ""
echo "Now redeploying..."
npx vercel --prod