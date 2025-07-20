# Vercel Quick Setup Guide

## Option 1: Using Vercel CLI (Fastest)

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy (in project directory)
vercel

# Follow prompts:
# - Set up and deploy? Yes
# - Which scope? (select your account)
# - Link to existing project? No
# - Project name? secl-directory
# - Directory? ./
# - Override settings? No
```

## Option 2: Manual Setup in Dashboard

1. Go to https://vercel.com/new
2. Import Git Repository → Select "secl-directory"
3. Configure Project:
   - Framework Preset: Next.js
   - Root Directory: ./
   - Build Command: npm run build
   - Output Directory: .next
   - Install Command: npm install

4. Environment Variables (Add these ONE BY ONE):

```
DATABASE_URL=postgresql://postgres.edxaomipjyqsldcbwaxr:yKMJf@FP%23Hxk6C9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require

NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNyJ6p-dysa2okJgPHuFrRlj0NtZHJbtsX-NJSFy6MdyRY_ooCjwSlZy2WhJU0ZUiDDXES-1A7i8REMw84fGht0

VAPID_PRIVATE_KEY=2d3OlmiNBlxJFZq5b0kuhUcU2vzVs_xsF3lgKfRe5tU

VAPID_EMAIL=mailto:admin@secl.co.in

NEXTAUTH_SECRET=0BtAZ3y0+MQfYd7PoNwXUjXjQ+Sp1Cw0VVF2rkZycn0=

NEXTAUTH_URL=https://secl-directory.vercel.app

NODE_ENV=production
```

5. Click "Deploy"

## If Deployment Fails

Run this locally to test:
```bash
npm run build
```

If build succeeds locally but fails on Vercel, it's an environment variable issue.