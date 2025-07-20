# Push Notifications Setup Guide

Push notifications are now fully integrated into the SECL Chat messaging system. Messages sent while users are offline will trigger push notifications on their devices.

## 1. Generate VAPID Keys

First, generate the VAPID keys needed for web push:

```bash
npm run generate:vapid
```

This will output three values that you need to add to your `.env.local` file:
- `NEXT_PUBLIC_VAPID_PUBLIC_KEY`
- `VAPID_PRIVATE_KEY`
- `VAPID_EMAIL` (replace with your email)

### 2. Configure Environment Variables

Add the following to your `.env.local`:

```env
# Push Notification Configuration
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your_public_key_here
VAPID_PRIVATE_KEY=your_private_key_here
VAPID_EMAIL=mailto:your-email@example.com

# Other required variables
JWT_SECRET=your-jwt-secret
DATABASE_URL=your-database-url
```

### 3. Test Push Notifications

1. **Enable Notifications in the App:**
   - Log in to the application
   - Navigate to Settings > Notifications
   - Click "Enable Notifications"
   - Accept the browser permission prompt

2. **Test from Navigation Bar:**
   - Click your profile avatar
   - Select "Test Notification"
   - You should receive a test notification

3. **Send Push Notification via API:**
   ```bash
   curl -X POST http://localhost:3000/api/push/send \
     -H "Content-Type: application/json" \
     -d '{
       "employeeId": "EMP001",
       "title": "Test Push Notification",
       "body": "This is a test push notification",
       "icon": "/icon-192x192.png"
     }'
   ```

## Platform-Specific Instructions

### Android (Chrome)

1. **Installation:**
   - Open the app in Chrome
   - Chrome will show an "Install" prompt or you can install from the menu
   - Open the installed app
   - Enable notifications when prompted

2. **Features:**
   - Full background notification support
   - Notification badges on app icon
   - Vibration support

### iOS (Safari)

**Requirements:** iOS 16.4 or later

1. **Installation:**
   - Open the app in Safari
   - Tap the Share button
   - Select "Add to Home Screen"
   - Open the app from your home screen (not Safari)
   - Enable notifications when prompted

2. **Limitations:**
   - Must be opened from home screen for notifications to work
   - No notification badges on iOS
   - Limited background sync capabilities

### Desktop Browsers

**Supported Browsers:**
- Chrome/Edge (Full support)
- Firefox (Full support)
- Safari 16+ (macOS 13+)

## Troubleshooting

### Notifications Not Working

1. **Check Browser Console:**
   ```javascript
   // Check if service worker is registered
   navigator.serviceWorker.ready.then(reg => console.log('SW Ready:', reg))
   
   // Check notification permission
   console.log('Permission:', Notification.permission)
   
   // Check push subscription
   navigator.serviceWorker.ready.then(reg => 
     reg.pushManager.getSubscription().then(sub => console.log('Subscription:', sub))
   )
   ```

2. **Common Issues:**
   - **iOS:** App must be installed to home screen and opened from there
   - **HTTPS Required:** Push notifications only work over HTTPS (localhost is exception)
   - **Blocked Permissions:** Check browser settings if notifications are blocked
   - **Service Worker:** Ensure service worker is registered and active

3. **Reset Notifications:**
   - Clear browser cache and cookies
   - Unregister service worker: `navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()))`
   - Re-enable notifications

### Testing in Development

For local development, you can use ngrok to test with HTTPS:

```bash
# Install ngrok
npm install -g ngrok

# Run your app
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# Use the HTTPS URL provided by ngrok
```

## API Reference

### Subscribe to Push Notifications
```
POST /api/push/subscribe
Authorization: Bearer <token>
Body: { subscription: PushSubscription }
```

### Unsubscribe from Push Notifications
```
POST /api/push/unsubscribe
Authorization: Bearer <token>
```

### Send Push Notification
```
POST /api/push/send
Body: {
  employeeId: string,
  title: string,
  body: string,
  icon?: string,
  badge?: string,
  data?: object
}
```

## Security Considerations

1. **VAPID Keys:** Keep your private key secure and never expose it client-side
2. **Authentication:** All push endpoints require valid JWT tokens
3. **HTTPS:** Always use HTTPS in production
4. **Content:** Never send sensitive data in push notification payloads

## Database Schema

The push subscriptions are stored in the `push_subscriptions` table:

```sql
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  employee_id VARCHAR(50) NOT NULL,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  platform VARCHAR(20) DEFAULT 'web',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Additional Resources

- [Web Push Protocol](https://developers.google.com/web/fundamentals/push-notifications)
- [PWA on iOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)