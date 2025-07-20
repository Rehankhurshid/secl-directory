# 🚀 Quick Deployment Guide - SECL PWA

## Prerequisites
- GitHub account
- Vercel account (free)
- Railway account (free tier available)

## Step 1: Deploy Main App to Vercel (5 minutes)

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "Add New" → "Project"**
3. **Import `secl-directory` repository**
4. **Add Environment Variables:**

```env
# Database (copy from your .env.local)
DATABASE_URL=postgresql://postgres.edxaomipjyqsldcbwaxr:yKMJf@FP%23Hxk6C9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?sslmode=require
DIRECT_URL=postgresql://postgres.edxaomipjyqsldcbwaxr:yKMJf@FP%23Hxk6C9@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNyJ6p-dysa2okJgPHuFrRlj0NtZHJbtsX-NJSFy6MdyRY_ooCjwSlZy2WhJU0ZUiDDXES-1A7i8REMw84fGht0
VAPID_PRIVATE_KEY=2d3OlmiNBlxJFZq5b0kuhUcU2vzVs_xsF3lgKfRe5tU
VAPID_EMAIL=mailto:admin@secl.co.in

# Security Keys (USE THESE EXACT VALUES)
NEXTAUTH_SECRET=U0FKD/CEZt/FpdbRiTGHWRTk6VqdNFt6mSNBSWsgjzk=
ENCRYPTION_KEY=2b0001b7e7cb113f3914874a47930dfe56089e82c30062ebbc5a39ada266bf8a
JWT_SECRET=U0FKD/CEZt/FpdbRiTGHWRTk6VqdNFt6mSNBSWsgjzk=

# URLs (update after deployment)
NEXT_PUBLIC_APP_URL=https://YOUR-PROJECT.vercel.app
NEXTAUTH_URL=https://YOUR-PROJECT.vercel.app

# Leave WebSocket URL empty for now
# NEXT_PUBLIC_WEBSOCKET_URL=

# Features
NEXT_PUBLIC_ENABLE_MESSAGING=true
NEXT_PUBLIC_ENABLE_ADVANCED_SEARCH=true
NEXT_PUBLIC_ENABLE_EXPORT=true

# App Config
NEXT_PUBLIC_APP_NAME=SECL Employee Directory
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_MAX_FILE_SIZE=5242880
NODE_ENV=production
```

5. **Click "Deploy"** and wait for build to complete

## Step 2: Deploy WebSocket Server to Railway (10 minutes)

### Option A: Using Railway CLI

```bash
# In your terminal
cd websocket-server
npm install -g @railway/cli
railway login
railway init  # Choose "Empty Project"
railway up
```

### Option B: Using GitHub

1. **Create new GitHub repository** for WebSocket server:
   ```bash
   cd websocket-server
   git init
   git add .
   git commit -m "SECL WebSocket server"
   git remote add origin https://github.com/YOUR_USERNAME/secl-websocket.git
   git push -u origin main
   ```

2. **In Railway Dashboard:**
   - New Project → Deploy from GitHub
   - Select your websocket repo
   - Add environment variable: `NODE_ENV=production`
   - Deploy

3. **Get WebSocket URL:**
   - Go to Settings → Generate Domain
   - Copy the URL (e.g., `secl-ws.up.railway.app`)

## Step 3: Connect Everything (2 minutes)

1. **Update Vercel Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add: `NEXT_PUBLIC_WEBSOCKET_URL=wss://YOUR-RAILWAY-APP.up.railway.app`
   - Redeploy by going to Deployments → Redeploy

2. **Update WebSocket Allowed Origins:**
   - In `websocket-server/server.js`, update ALLOWED_ORIGINS with your Vercel URL
   - Redeploy WebSocket server

## Step 4: Test Your Deployment

1. **Visit your Vercel URL**
2. **Login with employee credentials**
3. **Test messaging** - messages should work in real-time
4. **Test push notifications** - should auto-prompt on messaging page

## Troubleshooting

### WebSocket not connecting?
- Check browser console for errors
- Verify WebSocket URL in Network tab
- Ensure Railway app is running

### Push notifications not working?
- Must be on HTTPS (Vercel provides this)
- Check browser notification permissions
- Visit `/notifications/test` to debug

### Database errors?
- Verify DATABASE_URL is correct
- Check Supabase dashboard for connection limits

## Production URLs

After deployment, you'll have:
- Main App: `https://YOUR-PROJECT.vercel.app`
- WebSocket: `wss://YOUR-RAILWAY-APP.up.railway.app`
- Health Check: `https://YOUR-RAILWAY-APP.up.railway.app/health`

## Total Time: ~15-20 minutes

## Monthly Cost
- Vercel Free Tier: $0 (or Pro at $20/month for more features)
- Railway: $5/month (after free tier)
- Supabase: Free tier (or $25/month for Pro)
- **Total: $5-50/month depending on usage**