import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { sessionManager } from '@/lib/auth/session-manager';

// Direct test endpoint that bypasses the service layer
export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Direct push test endpoint called');
    
    // Get auth token
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get session
    const session = await sessionManager.getAuthSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Configure VAPID
    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    const vapidEmail = process.env.VAPID_EMAIL || 'mailto:admin@secl.co.in';

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.error('❌ VAPID keys not configured');
      return NextResponse.json({ 
        error: 'VAPID keys not configured',
        details: {
          hasPublic: !!vapidPublicKey,
          hasPrivate: !!vapidPrivateKey,
          email: vapidEmail
        }
      }, { status: 500 });
    }

    webpush.setVapidDetails(
      vapidEmail.startsWith('mailto:') ? vapidEmail : `mailto:${vapidEmail}`,
      vapidPublicKey,
      vapidPrivateKey
    );

    // Get subscription
    const subscriptions = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.employee_id, session.employeeId));

    if (subscriptions.length === 0) {
      return NextResponse.json({ 
        error: 'No push subscription found',
        employeeId: session.employeeId
      }, { status: 404 });
    }

    console.log(`📬 Found ${subscriptions.length} subscription(s) for ${session.employeeId}`);

    // Send to all subscriptions
    const results = [];
    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth,
          },
        };

        const payload = JSON.stringify({
          title: '🧪 Direct Test Notification',
          body: `Test at ${new Date().toLocaleTimeString()} - If you see this, push notifications are working!`,
          icon: '/icon-192x192.png',
          badge: '/icon-72x72.png',
          tag: 'test-' + Date.now(),
          data: {
            type: 'direct-test',
            timestamp: Date.now(),
            url: '/messaging'
          }
        });

        console.log('📤 Sending push notification to:', sub.endpoint.substring(0, 50) + '...');
        
        await webpush.sendNotification(pushSubscription, payload);
        
        console.log('✅ Push sent successfully');
        results.push({ 
          success: true, 
          endpoint: sub.endpoint.substring(0, 50) + '...' 
        });
      } catch (error: any) {
        console.error('❌ Push failed:', error);
        results.push({ 
          success: false, 
          endpoint: sub.endpoint.substring(0, 50) + '...', 
          error: error.message,
          statusCode: error.statusCode
        });

        // Clean up invalid subscription
        if (error.statusCode === 410) {
          await db.delete(pushSubscriptions).where(eq(pushSubscriptions.id, sub.id));
          console.log('🗑️ Removed invalid subscription');
        }
      }
    }

    const successCount = results.filter(r => r.success).length;

    return NextResponse.json({
      success: successCount > 0,
      message: `Sent ${successCount}/${results.length} notifications`,
      results,
      debug: {
        employeeId: session.employeeId,
        subscriptionCount: subscriptions.length,
        vapidEmail,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Direct test error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}