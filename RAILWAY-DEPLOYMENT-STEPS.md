# Railway WebSocket Server Deployment - Manual Steps

## Your WebSocket server is ready for deployment!

### Step 1: Create GitHub Repository

```bash
# The WebSocket server code is in: websocket-server/

# Create a new repository on GitHub:
1. Go to https://github.com/new
2. Repository name: secl-websocket
3. Make it Public
4. Don't initialize with README (we already have one)
5. Create repository
```

### Step 2: Push to GitHub

Run these commands in your terminal:

```bash
cd /Users/nayyarkhurshid/Desktop/SECL\ Cursor/websocket-server
git remote add origin https://github.com/Rehankhurshid/secl-websocket.git
git branch -M main
git push -u origin main
```

### Step 3: Deploy to Railway

1. **Go to [railway.app](https://railway.app)**
2. **Sign in with GitHub**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose `secl-websocket` repository**
6. **Railway will auto-detect Node.js and deploy**

### Step 4: Configure Environment

In Railway dashboard:
1. Click on your service
2. Go to "Variables" tab
3. Add:
   ```
   NODE_ENV=production
   PORT=3002
   ```

### Step 5: Generate Domain

1. Go to "Settings" tab
2. Under "Domains", click "Generate Domain"
3. You'll get a URL like: `secl-websocket.up.railway.app`

### Step 6: Update Vercel

1. Go to your Vercel project settings
2. Add environment variable:
   ```
   NEXT_PUBLIC_WEBSOCKET_URL=wss://secl-websocket.up.railway.app
   ```
3. Redeploy your Vercel app

## Alternative: One-Click Deploy

[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/Rehankhurshid/secl-websocket)

## Testing

Once deployed, test the WebSocket connection:

```javascript
// In browser console
const ws = new WebSocket('wss://your-app.up.railway.app');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
```

## Files Created

✅ `/websocket-server/` - Complete WebSocket server
✅ `Dockerfile` - For containerized deployment
✅ `railway.json` - Railway configuration
✅ `package.json` - Dependencies configured
✅ `.gitignore` - Proper ignore rules

## Next Steps

1. Push to GitHub
2. Deploy on Railway
3. Get WebSocket URL
4. Update Vercel environment variable
5. Test real-time messaging!