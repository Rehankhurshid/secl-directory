#!/bin/bash

echo "Setting all environment variables for Vercel..."

# Database
npx vercel env add DATABASE_URL production development preview <<< "postgresql://postgres.edxaomipjyqsldcbwaxr:yKMJf@FP%23Hxk6C9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require"
npx vercel env add DIRECT_URL production development preview <<< "postgresql://postgres.edxaomipjyqsldcbwaxr:yKMJf@FP%23Hxk6C9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres"

# Authentication  
npx vercel env add NEXTAUTH_SECRET production development preview <<< "BtAZ3y0+MQfYd7PoNwXUjXjQ+Sp1Cw0VVF2rkZycn0="
npx vercel env add NEXTAUTH_URL production development preview <<< "https://coal-india-app.vercel.app"
npx vercel env add JWT_SECRET production development preview <<< "BtAZ3y0+MQfYd7PoNwXUjXjQ+Sp1Cw0VVF2rkZycn0="

# Security
npx vercel env add ENCRYPTION_KEY production development preview <<< "905fa49dd2d3a3cb3cec566639c2431e6a47ad6fc86cb503ead97dad69c2434f"

# Push Notifications
npx vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY production development preview <<< "BNyJ6p-dysa2okJgPHuFrRlj0NtZHJbtsX-NJSFy6MdyRY_ooCjwSlZy2WhJU0ZUiDDXES-1A7i8REMw84fGht0"
npx vercel env add VAPID_PRIVATE_KEY production development preview <<< "2d3OlmiNBlxJFZq5b0kuhUcU2vzVs_xsF3lgKfRe5tU"
npx vercel env add VAPID_EMAIL production development preview <<< "mailto:admin@secl.co.in"

# Application URLs
npx vercel env add NEXT_PUBLIC_APP_URL production development preview <<< "https://coal-india-app.vercel.app"
npx vercel env add NEXT_PUBLIC_WEBSOCKET_URL production development preview <<< "wss://secl-websocket-production.up.railway.app"

# Application Configuration
npx vercel env add NEXT_PUBLIC_APP_NAME production development preview <<< "SECL Employee Directory"
npx vercel env add NEXT_PUBLIC_APP_VERSION production development preview <<< "1.0.0"
npx vercel env add NEXT_PUBLIC_MAX_FILE_SIZE production development preview <<< "5242880"

# Feature Flags
npx vercel env add NEXT_PUBLIC_ENABLE_MESSAGING production development preview <<< "true"
npx vercel env add NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH production development preview <<< "true"
npx vercel env add NEXT_PUBLIC_ENABLE_EXPORT production development preview <<< "true"

# Environment
npx vercel env add NODE_ENV production development preview <<< "production"

echo "✅ All environment variables set!"