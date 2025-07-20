# WebSocket Setup & Troubleshooting Guide

## 🔧 Fixed Issues

Your WebSocket connection issues have been resolved by addressing several configuration problems:

### 1. **Environment Variable Fix**

- **Problem**: `NEXT_PUBLIC_SOCKET_URL` was pointing to `http://localhost:3000` (Next.js server)
- **Solution**: Updated to `http://localhost:3001` (Socket.IO server)

### 2. **Server Scripts Added**

- **Problem**: No easy way to start both servers
- **Solution**: Added new npm scripts:
  ```bash
  npm run dev:with-socket    # Starts both Next.js and Socket.IO servers
  npm run socket:server      # Starts only Socket.IO server
  ```

### 3. **Socket Client Improvements**

- **Problem**: Poor error handling and connection management
- **Solution**: Enhanced connection logic with proper retry mechanisms

### 4. **Development Server Integration**

- **Problem**: Socket.IO server wasn't properly integrated
- **Solution**: Created `scripts/dev-with-socket.js` to manage both servers

## 🚀 How to Run

### Option 1: Start Both Servers (Recommended)

```bash
npm run dev:with-socket
```

This will start:

- Next.js on `http://localhost:3000`
- Socket.IO server on `http://localhost:3001`

### Option 2: Start Servers Separately

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run socket:server
```

## 🔍 Troubleshooting

### 1. Check Socket.IO Server Status

```bash
curl http://localhost:3001
# Should return: "Socket.IO server is running"
```

### 2. Verify Environment Variables

Make sure `.env.local` contains:

```bash
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
SOCKET_PORT=3001
```

### 3. Check Browser Console

Look for these messages:

- ✅ `Socket connected successfully`
- ✅ `Joined groups: [1, 2]`

### 4. Connection Issues

If you see "WebSocket is closed before connection":

1. Ensure Socket.IO server is running on port 3001
2. Check firewall settings
3. Restart both servers

### 5. Authentication Issues

If socket authentication fails:

1. Check JWT token in localStorage
2. Verify token format in browser dev tools
3. Check server logs for authentication errors

## 📱 Testing the Connection

1. Open browser dev tools → Console
2. Navigate to messaging page
3. Look for connection logs:
   ```
   🔌 Connecting to Socket.IO server...
   🌐 Socket URL: http://localhost:3001
   ✅ Socket connected successfully
   ✅ Joined groups: [1, 2]
   ```

## 🔧 Development Notes

### Mock Data

The current setup uses mock data for development:

- Mock user ID: `ADMIN001`
- Mock groups: `[1, 2]`
- Test messages are broadcasted to all connected clients

### Production Considerations

For production deployment:

1. Update JWT authentication in `scripts/socket-server.js`
2. Configure proper CORS origins
3. Use a process manager like PM2
4. Set up proper SSL/TLS for WebSocket connections

### File Structure

```
scripts/
├── socket-server.js         # Standalone Socket.IO server
├── dev-with-socket.js      # Development server manager
src/lib/socket/
├── client.ts               # Frontend Socket.IO client
├── server.ts              # TypeScript Socket.IO server (for production)
```

## 🎯 Next Steps

1. **Test messaging**: Send a test message in the chat interface
2. **Monitor connections**: Watch browser console for real-time updates
3. **Check performance**: Monitor connection stability during usage

The WebSocket implementation is now properly configured and should resolve all connection issues you were experiencing!
