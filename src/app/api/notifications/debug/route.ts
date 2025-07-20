import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  const headersList = headers();
  const userAgent = headersList.get('user-agent') || 'Unknown';
  
  // Detect platform
  const isAndroid = /Android/i.test(userAgent);
  const isIOS = /iPhone|iPad|iPod/i.test(userAgent);
  const isMobile = isAndroid || isIOS;
  
  // Check protocol
  const protocol = headersList.get('x-forwarded-proto') || 
                   request.url.startsWith('https') ? 'https' : 'http';
  
  // Service Worker info
  const swScope = request.url.replace(/\/api\/.*$/, '/');
  
  return NextResponse.json({
    environment: {
      platform: isAndroid ? 'Android' : isIOS ? 'iOS' : 'Desktop',
      isMobile,
      userAgent: userAgent.substring(0, 100),
      protocol,
      isSecure: protocol === 'https',
      host: headersList.get('host'),
    },
    serviceWorker: {
      expectedScope: swScope,
      scriptURL: `${swScope}sw.js`,
      requirements: {
        https: protocol === 'https',
        supportedBrowser: true
      }
    },
    vapid: {
      publicKeySet: !!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      privateKeySet: !!process.env.VAPID_PRIVATE_KEY,
      emailSet: !!process.env.VAPID_EMAIL,
      publicKeyLength: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.length || 0
    },
    troubleshooting: {
      android: isAndroid ? {
        steps: [
          '1. Ensure you are using Chrome browser (not WebView)',
          '2. Check Chrome version (Menu → Settings → About Chrome) - needs v50+',
          '3. Go to Chrome Settings → Site Settings → Notifications',
          '4. Ensure notifications are not blocked for this site',
          '5. Try "Add to Home Screen" to install as PWA',
          '6. Check Android Settings → Apps → Chrome → Notifications are enabled',
          '7. Disable battery optimization for Chrome if enabled'
        ]
      } : null,
      ios: isIOS ? {
        requirements: 'iOS 16.4+ and must be installed as PWA from Safari',
        steps: [
          '1. Open in Safari (not Chrome)',
          '2. Tap Share button → Add to Home Screen',
          '3. Open from home screen icon (not Safari)',
          '4. Allow notifications when prompted'
        ]
      } : null
    },
    testEndpoints: {
      subscription: '/api/notifications/subscribe',
      test: '/api/notifications/test',
      directTest: '/api/notifications/test-direct'
    }
  });
}