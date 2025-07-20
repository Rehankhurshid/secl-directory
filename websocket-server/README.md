# SECL WebSocket Server

WebSocket server for real-time messaging in SECL PWA.

## Deployment Options

### Railway (Recommended)

1. Install Railway CLI:
   ```bash
   npm install -g @railway/cli
   ```

2. Login and deploy:
   ```bash
   railway login
   railway init
   railway up
   ```

3. Get your WebSocket URL from Railway dashboard.

### Render

1. Create new Web Service on render.com
2. Connect this repository
3. Set build command: `npm install`
4. Set start command: `npm start`
5. Deploy

### Environment Variables

- `PORT`: Server port (default: 3002)
- `NODE_ENV`: Set to 'production' for production deployment

## Local Development

```bash
npm install
npm run dev
```

## Production URLs

Update the ALLOWED_ORIGINS in server.js with your production domains.