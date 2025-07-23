# Railway WebSocket Deployment Guide

## Quick Deploy Steps

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Deploy WebSocket Server**

   ```bash
   # Navigate to websocket server directory
   cd websocket-server
   
   # Install Railway CLI (if not already installed)
   npm install -g @railway/cli
   
   # Login to Railway
   railway login
   
   # Initialize new project
   railway init
   # Select "Empty Project"
   
   # Link to Railway project
   railway link
   
   # Deploy
   railway up
   ```

3. **Set Environment Variables in Railway Dashboard**
   ```
   NODE_ENV=production
   PORT=3002
   ```

4. **Get Your WebSocket URL**
   - Go to Railway dashboard
   - Click on your service
   - Go to Settings → Domains
   - Generate domain (it will be like: `your-app.up.railway.app`)
   - Your WebSocket URL: `wss://your-app.up.railway.app`

5. **Update Vercel Environment Variables**
   - Go back to Vercel dashboard
   - Add: `NEXT_PUBLIC_WEBSOCKET_URL=wss://your-app.up.railway.app`
   - Redeploy your Vercel app

## Alternative: Manual GitHub Deploy

1. **Create separate GitHub repo for WebSocket server**
   ```bash
   cd websocket-server
   git init
   git add .
   git commit -m "Initial WebSocket server"
   git remote add origin https://github.com/YOUR_USERNAME/secl-websocket.git
   git push -u origin main
   ```

2. **In Railway Dashboard**
   - New Project → Deploy from GitHub repo
   - Select your websocket repo
   - Deploy

## Testing WebSocket Connection

```javascript
// In browser console on your deployed app
const ws = new WebSocket('wss://your-app.up.railway.app');
ws.onopen = () => console.log('Connected!');
ws.onmessage = (e) => console.log('Message:', e.data);
```

## Monitoring

- Railway provides built-in metrics
- Check logs in Railway dashboard
- Health endpoint: `https://your-app.up.railway.app/health`