# Real-Time Messaging Fix Guide

## 🔧 **Issues Fixed for Real-Time Messages**

Your WebSocket setup had several issues preventing real-time message delivery. Here's what I've fixed:

### 1. **Server Startup Order**

- **Problem**: Next.js and Socket.IO servers were starting simultaneously, causing port conflicts
- **Fix**: Socket.IO server now starts first (port 3001), then Next.js (port 3000)

### 2. **Message Listener Setup**

- **Problem**: Multiple listeners being attached, causing confusion
- **Fix**: Added proper listener cleanup and better debugging

### 3. **Enhanced Debugging**

- **Problem**: Limited visibility into what's happening with messages
- **Fix**: Added comprehensive logging throughout the message flow

## 📊 **Current Server Setup**

- **Socket.IO Server**: `http://localhost:3001`
- **Next.js Server**: `http://localhost:3000`
- **Environment**: `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001`

## 🧪 **Testing Real-Time Messages**

### Step 1: Check Server Status

```bash
# Check Socket.IO server
curl http://localhost:3001
# Should return: "Socket.IO server is running"

# Check Next.js server
curl http://localhost:3000 | head -5
# Should return HTML content
```

### Step 2: Test with Debug Page

1. Go to: `http://localhost:3000/messaging-debug`
2. Check connection status (should show Connected: Yes, Authenticated: Yes)
3. Send a test message
4. Open another browser tab to the same page
5. Send messages between tabs - they should appear in real-time

### Step 3: Monitor Console Logs

Open browser console to see detailed logging:

**Connection Logs:**

```
🔌 Connecting to Socket.IO server...
🌐 Socket URL: http://localhost:3001
✅ Socket connected successfully
✅ Joined groups: [1, 2]
```

**Message Sending Logs:**

```
📤 Attempting to send message: {groupId: 1, content: "test", connected: true, authenticated: true}
✅ Message sent via socket
```

**Message Receiving Logs:**

```
📨 Received new-message event: {id: "msg-123", content: "test", ...}
📊 Current user ID: ADMIN001
📊 Message sender ID: ADMIN001
🚫 Skipping own message from socket to avoid duplicate
```

## 🔍 **Troubleshooting Real-Time Issues**

### Issue: "Cannot send message - socket not ready"

**Solution:**

1. Check connection status in debug page
2. Verify `NEXT_PUBLIC_SOCKET_URL=http://localhost:3001`
3. Restart servers: `npm run dev:with-socket`

### Issue: Messages not appearing in real-time

**Check Console for:**

- `📨 Received new-message event` - If missing, socket not receiving
- `🚫 Skipping own message` - Own messages are intentionally skipped
- `✅ Added new message` - Message successfully added to UI

### Issue: Socket connection failing

**Solutions:**

1. Check if port 3001 is available: `lsof -i :3001`
2. Kill conflicting processes: `pkill -f socket-server`
3. Restart with clean ports: `npm run dev:with-socket`

## 🎯 **What Should Happen**

1. **Send Message**: Your message appears immediately (optimistic update)
2. **Real-Time**: Other users see your message instantly via WebSocket
3. **No Duplicates**: Your own messages are filtered to prevent duplicates

## 🚀 **Next Steps**

1. **Test the debug page** first to verify basic WebSocket functionality
2. **Open multiple browser tabs** to test real-time messaging between users
3. **Monitor console logs** to see the message flow
4. **Try the regular messaging interface** once debug page works

The real-time messaging should now work correctly! 🎉

## 📝 **Files Modified**

- `scripts/dev-with-socket.js` - Fixed server startup order
- `src/lib/socket/client.ts` - Enhanced message handling and debugging
- `src/components/messaging/v0-rebuild/messaging-layout.tsx` - Better real-time message processing
- `src/app/messaging-debug/` - Debug interface for testing
- `.env.local` - Proper port configuration
