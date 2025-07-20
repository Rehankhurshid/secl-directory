# WebSocket Server Deployment Guide

Since your main app deploys on Vercel (serverless), you need to deploy the WebSocket server separately. Here are the best options:

## Option 1: Railway (Recommended - $5/month)

Railway is perfect for WebSocket servers with great pricing and easy deployment.

### Setup Steps:

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login
   railway login
   
   # Initialize in your project
   cd /path/to/secl-directory
   railway init
   ```

3. **Create WebSocket Service**
   ```bash
   # Create a new service for WebSocket
   railway add
   
   # Deploy WebSocket server
   railway up scripts/websocket-server.js
   ```

4. **Get Your WebSocket URL**
   - Railway will provide a URL like: `wss://your-app.up.railway.app`
   - Update your production env: `NEXT_PUBLIC_WEBSOCKET_URL=wss://your-app.up.railway.app`

## Option 2: Render (Free tier available)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up

2. **Create Web Service**
   - New → Web Service
   - Connect GitHub repo
   - Settings:
     - Build Command: `npm install`
     - Start Command: `node scripts/websocket-server.js`
     - Environment: Node
     - Plan: Free or Starter ($7/month)

3. **Configure Environment**
   ```
   PORT=10000
   HOST=0.0.0.0
   ```

## Option 3: Fly.io ($0-5/month)

1. **Install Fly CLI**
   ```bash
   curl -L https://fly.io/install.sh | sh
   ```

2. **Create fly.toml**
   ```toml
   app = "secl-websocket"
   primary_region = "dfw"

   [http_service]
     internal_port = 3002
     force_https = true
     auto_stop_machines = true
     auto_start_machines = true

   [[vm]]
     cpu_kind = "shared"
     cpus = 1
     memory_mb = 256
   ```

3. **Deploy**
   ```bash
   fly launch
   fly deploy
   ```

## Production Environment Variables

Update your Vercel environment variables:

```bash
# Production WebSocket URL (from your chosen provider)
NEXT_PUBLIC_WEBSOCKET_URL=wss://your-websocket-server.railway.app

# Keep the same VAPID keys for push notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=BNyJ6p-dysa2okJgPHuFrRlj0NtZHJbtsX-NJSFy6MdyRY_ooCjwSlZy2WhJU0ZUiDDXES-1A7i8REMw84fGht0
VAPID_PRIVATE_KEY=2d3OlmiNBlxJFZq5b0kuhUcU2vzVs_xsF3lgKfRe5tU
VAPID_EMAIL=mailto:admin@secl.co.in

# Production app URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

## WebSocket Server Configuration

Update `scripts/websocket-server.js` for production:

```javascript
// Add at the top of websocket-server.js
const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production' 
  ? ['https://your-domain.vercel.app', 'https://your-custom-domain.com']
  : ['http://localhost:3000'];

// Update CORS in verifyClient
verifyClient: (info) => {
  const origin = info.origin || info.req.headers.origin;
  return ALLOWED_ORIGINS.includes(origin);
}
```

## Testing After Deployment

1. **Test WebSocket Connection**
   ```javascript
   // In browser console
   const ws = new WebSocket('wss://your-websocket-server.railway.app');
   ws.onopen = () => console.log('Connected!');
   ws.onmessage = (e) => console.log('Message:', e.data);
   ```

2. **Test Push Notifications**
   - Visit `/notifications/test` on your production site
   - Ensure HTTPS is working
   - Check service worker registration

## Monitoring

### Railway
- Built-in metrics dashboard
- Logs viewer
- Usage tracking

### Custom Monitoring
Add to your WebSocket server:

```javascript
// Health check endpoint
server.on('request', (req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy',
      connections: wss.clients.size,
      uptime: process.uptime()
    }));
  }
});
```

## Cost Summary

- **Vercel Pro**: $20/month (main app)
- **Supabase Pro**: $25/month (database)
- **Railway/Render**: $5-7/month (WebSocket)
- **Total**: ~$50-52/month

## Troubleshooting

### WebSocket not connecting
- Check CORS settings
- Verify WSS protocol for HTTPS
- Check firewall rules

### Push notifications not working
- Verify HTTPS on main domain
- Check VAPID keys match
- Test service worker registration

### High latency
- Choose server region close to users
- Enable WebSocket compression
- Implement connection pooling