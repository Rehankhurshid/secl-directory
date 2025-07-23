# 🚀 Production Deployment Test Checklist

## Deployment URLs
- **Main App**: https://secl-directory.vercel.app
- **WebSocket**: wss://[your-railway-domain].up.railway.app

## Test Checklist

### 1. Basic App Functionality
- [ ] Visit https://secl-directory.vercel.app
- [ ] Verify the app loads without errors
- [ ] Check browser console for any errors

### 2. Employee Directory
- [ ] Navigate to Employee Directory
- [ ] Search for employees
- [ ] Filter by department/designation
- [ ] View employee details

### 3. Authentication
- [ ] Login with employee credentials
- [ ] Verify session persists
- [ ] Logout functionality works

### 4. WebSocket Connection
Test in browser console:
```javascript
// Test WebSocket connection
const ws = new WebSocket('wss://your-railway-domain.up.railway.app');
ws.onopen = () => console.log('✅ WebSocket Connected!');
ws.onmessage = (e) => console.log('📨 Message:', e.data);
ws.onerror = (e) => console.error('❌ Error:', e);
```

### 5. Real-time Messaging
- [ ] Go to /messaging
- [ ] Create or join a group
- [ ] Send a message
- [ ] Verify real-time delivery
- [ ] Test with multiple browser tabs/devices

### 6. Push Notifications
- [ ] Visit messaging page
- [ ] Accept notification permission prompt
- [ ] Send a message from another tab/device
- [ ] Verify push notification appears

### 7. PWA Features
- [ ] Check "Install App" prompt on mobile
- [ ] Verify offline page works
- [ ] Test service worker registration

### 8. Health Checks
```javascript
// Test WebSocket health endpoint
fetch('https://your-railway-domain.up.railway.app/health')
  .then(r => r.json())
  .then(data => console.log('🏥 WebSocket Health:', data));
```

## Common Issues & Solutions

### WebSocket not connecting?
1. Check Railway logs for errors
2. Verify NEXT_PUBLIC_WEBSOCKET_URL in Vercel
3. Check CORS configuration in WebSocket server

### Push notifications not working?
1. Must be on HTTPS (Vercel provides this)
2. Check browser notification permissions
3. Verify VAPID keys match in Vercel env vars

### Authentication issues?
1. Verify DATABASE_URL in Vercel
2. Check NEXTAUTH_SECRET matches
3. Clear browser cookies and try again

## Success Criteria
✅ App loads on Vercel URL
✅ WebSocket connects to Railway
✅ Real-time messaging works
✅ Push notifications functional
✅ No console errors

## Monitoring
- **Vercel Dashboard**: Check function logs
- **Railway Dashboard**: Monitor WebSocket connections
- **Browser DevTools**: Watch for errors

Congratulations on your production deployment! 🎉