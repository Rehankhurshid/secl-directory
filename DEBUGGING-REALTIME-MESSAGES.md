# Debugging Real-time Messages

## Issue
Messages don't appear in real-time and require a page refresh to show up.

## Debugging Steps

### 1. Check Socket.IO Server is Running
In a terminal, make sure the Socket.IO server is running:
```bash
npm run socket:dev
```

You should see:
```
🚀 Socket.IO server running on port 3001
📡 CORS enabled for: http://localhost:3000, http://localhost:3001, http://localhost:3002
🔗 Connect from client using: http://localhost:3001
```

### 2. Monitor WebSocket Connections
In a new terminal, run the monitor script:
```bash
node scripts/monitor-socket.js
```

This will show:
- When clients connect/disconnect
- All messages being broadcasted
- Group joins

### 3. Test Message Broadcasting
In another terminal, test broadcasting:
```bash
node scripts/test-socket-broadcast.js
```

This will send a test message to group 1. Check if:
- The monitor script shows the message
- The browser console shows the message received

### 4. Browser Console Checks

Open the browser console and look for these logs:

#### On Page Load:
- `🔌 Connecting to WebSocket with token and userId:`
- `✅ Socket connected successfully`
- `✅ Joined groups: [1, 2]`
- `🔗 Setting up real-time message listener for user:`

#### When Sending a Message:
- `📤 Sending message optimistically:`
- `✅ Message sent successfully:`

#### When Receiving a Message (from another user):
- `📨 Received real-time message:`
- `📬 Message is for current group, updating cache`
- `✅ Added new message, total now:`

### 5. Common Issues and Solutions

#### Issue: "Message is for different group"
- The message groupId doesn't match selectedGroupId
- Check if groupId types match (number vs string)

#### Issue: No "Received real-time message" logs
- Socket connection might be broken
- Check for connection errors in console
- Verify NEXT_PUBLIC_SOCKET_URL=http://localhost:3001

#### Issue: Messages added to cache but UI doesn't update
- React Query might not be re-rendering
- Check if the query key matches exactly
- Verify the messages array reference is changing

### 6. Quick Test Checklist

1. **Two Browser Windows Test**:
   - Open the app in two different browser windows
   - Log in as different users (or use incognito)
   - Send a message from one window
   - Should appear instantly in the other window

2. **Check Environment**:
   ```bash
   cat .env.local | grep SOCKET
   ```
   Should show:
   ```
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
   SOCKET_PORT=3001
   ```

3. **Check Processes**:
   ```bash
   lsof -i :3001  # Should show node process for Socket.IO
   lsof -i :3000  # Should show node process for Next.js
   ```

### 7. API Broadcast Test

To test if the API is successfully broadcasting:

1. Run the monitor script: `node scripts/monitor-socket.js`
2. Send a message through the UI
3. Check if the monitor shows: `📨 NEW MESSAGE RECEIVED:`

If the monitor doesn't show the message, the API → Socket.IO broadcast isn't working.

### 8. Debug Output Analysis

Look for this flow in the console:

1. **Client sends message**:
   ```
   📤 Sending message optimistically: {groupId: 1, content: "Hello"}
   ✅ Updated messages optimistically, new count: 5
   ```

2. **API processes and broadcasts**:
   ```
   ✅ Message sent successfully: {id: 123, content: "Hello", ...}
   ```

3. **Other clients receive**:
   ```
   📨 Received real-time message: {id: "123", groupId: 1, ...}
   📬 Message is for current group, updating cache
   ✅ Added new message, total now: 6
   ```

### 9. Force Refresh Test

If messages appear after refresh but not in real-time:
1. The database save is working ✓
2. The Socket.IO broadcast might be failing ✗
3. Or the client-side cache update might be failing ✗

### 10. Emergency Fix

If you need a temporary workaround while debugging:
```javascript
// In messaging-layout.tsx, after sending a message:
// Add a query invalidation with a slight delay
setTimeout(() => {
  queryClient.invalidateQueries({ 
    queryKey: ['messaging', 'groups', selectedGroupId, 'messages'] 
  });
}, 1000);
```

This forces a refetch but isn't ideal for production.