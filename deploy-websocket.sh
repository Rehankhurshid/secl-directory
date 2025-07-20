#!/bin/bash

echo "🚀 SECL WebSocket Server Deployment Script"
echo "========================================="
echo ""
echo "This script will help you deploy the WebSocket server to Railway"
echo ""

# Check if we're in the right directory
if [ ! -d "websocket-server" ]; then
    echo "❌ Error: websocket-server directory not found!"
    echo "Please run this script from the SECL Cursor directory"
    exit 1
fi

echo "📁 WebSocket server files are ready in: websocket-server/"
echo ""
echo "📋 Next steps:"
echo "1. Create a new GitHub repository named 'secl-websocket'"
echo "   👉 Go to: https://github.com/new"
echo ""
echo "2. After creating the repo, run these commands:"
echo ""
echo "cd websocket-server"
echo "git remote add origin https://github.com/Rehankhurshid/secl-websocket.git"
echo "git push -u origin main"
echo ""
echo "3. Deploy to Railway:"
echo "   👉 Go to: https://railway.app"
echo "   - Click 'New Project'"
echo "   - Select 'Deploy from GitHub repo'"
echo "   - Choose 'secl-websocket'"
echo ""
echo "4. In Railway, add these environment variables:"
echo "   NODE_ENV=production"
echo "   PORT=3002"
echo ""
echo "5. Generate a domain in Railway Settings"
echo ""
echo "6. Update Vercel with the WebSocket URL:"
echo "   NEXT_PUBLIC_WEBSOCKET_URL=wss://your-app.up.railway.app"
echo ""
echo "Ready to proceed? Check RAILWAY-DEPLOYMENT-STEPS.md for detailed instructions!"