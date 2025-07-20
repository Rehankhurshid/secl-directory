#!/bin/bash

echo "🚀 Fresh Vercel Deployment Script"
echo "================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Please run from project root.${NC}"
    exit 1
fi

echo -e "${YELLOW}Step 1: Logging in to Vercel...${NC}"
npx vercel login

echo -e "${YELLOW}Step 2: Creating new Vercel project...${NC}"
echo "Project name: coal-india-app"

# Deploy with all environment variables
echo -e "${YELLOW}Step 3: Deploying with environment variables...${NC}"

npx vercel --prod --yes \
  --name coal-india-app \
  --env DATABASE_URL="postgresql://postgres.edxaomipjyqsldcbwaxr:yKMJf@FP%23Hxk6C9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require" \
  --env DIRECT_URL="postgresql://postgres.edxaomipjyqsldcbwaxr:yKMJf@FP%23Hxk6C9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres" \
  --env NEXTAUTH_SECRET="BtAZ3y0+MQfYd7PoNwXUjXjQ+Sp1Cw0VVF2rkZycn0=" \
  --env NEXTAUTH_URL="https://coal-india-app.vercel.app" \
  --env JWT_SECRET="BtAZ3y0+MQfYd7PoNwXUjXjQ+Sp1Cw0VVF2rkZycn0=" \
  --env ENCRYPTION_KEY="905fa49dd2d3a3cb3cec566639c2431e6a47ad6fc86cb503ead97dad69c2434f" \
  --env NEXT_PUBLIC_VAPID_PUBLIC_KEY="BNyJ6p-dysa2okJgPHuFrRlj0NtZHJbtsX-NJSFy6MdyRY_ooCjwSlZy2WhJU0ZUiDDXES-1A7i8REMw84fGht0" \
  --env VAPID_PRIVATE_KEY="2d3OlmiNBlxJFZq5b0kuhUcU2vzVs_xsF3lgKfRe5tU" \
  --env VAPID_EMAIL="mailto:admin@secl.co.in" \
  --env NEXT_PUBLIC_APP_URL="https://coal-india-app.vercel.app" \
  --env NEXT_PUBLIC_WEBSOCKET_URL="wss://secl-websocket-production.up.railway.app" \
  --env NEXT_PUBLIC_APP_NAME="SECL Employee Directory" \
  --env NEXT_PUBLIC_APP_VERSION="1.0.0" \
  --env NEXT_PUBLIC_MAX_FILE_SIZE="5242880" \
  --env NEXT_PUBLIC_ENABLE_MESSAGING="true" \
  --env NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH="true" \
  --env NEXT_PUBLIC_ENABLE_EXPORT="true" \
  --env NODE_ENV="production"

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo -e "${BLUE}Your app should be available at: https://coal-india-app.vercel.app${NC}"
echo ""
echo "Test URLs:"
echo "- Health Check: https://coal-india-app.vercel.app/api/health"
echo "- Database Test: https://coal-india-app.vercel.app/api/auth/test-db"
echo "- Main App: https://coal-india-app.vercel.app"