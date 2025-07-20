import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pushSubscriptions } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { sessionManager } from '@/lib/auth/session-manager';

// POST /api/notifications/subscribe - Subscribe to push notifications
export async function POST(request: NextRequest) {
  try {
    console.log('🔔 Push subscription request received');

    // Get auth token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      console.error('❌ No authorization token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from session token
    const session = await sessionManager.getAuthSessionByToken(token);
    if (!session) {
      console.error('❌ Invalid session token');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    console.log('✅ Session validated for employee:', session.employeeId);

    // Parse request body
    const body = await request.json();
    console.log('📋 Subscription data received:', {
      hasEndpoint: !!body.endpoint,
      hasKeys: !!body.keys,
      hasP256dh: !!body.keys?.p256dh,
      hasAuth: !!body.keys?.auth
    });

    // Validate subscription format according to MDN standards
    if (!body.endpoint || !body.keys || !body.keys.p256dh || !body.keys.auth) {
      console.error('❌ Invalid subscription format');
      return NextResponse.json({ 
        error: 'Invalid subscription format. Required: endpoint, keys.p256dh, keys.auth' 
      }, { status: 400 });
    }

    const { endpoint, keys } = body;
    const { p256dh, auth } = keys;

    // Validate endpoint URL
    try {
      new URL(endpoint);
    } catch (error) {
      console.error('❌ Invalid endpoint URL:', endpoint);
      return NextResponse.json({ error: 'Invalid endpoint URL' }, { status: 400 });
    }

    // Validate base64 keys
    if (!isValidBase64(p256dh) || !isValidBase64(auth)) {
      console.error('❌ Invalid base64 encoding in keys');
      return NextResponse.json({ error: 'Invalid key encoding' }, { status: 400 });
    }

    console.log('✅ Subscription validation passed');

    // Check if subscription already exists for this user
    const existingSubscription = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.employee_id, session.employeeId))
      .limit(1);

    if (existingSubscription.length > 0) {
      console.log('📝 Updating existing subscription');
      
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          endpoint,
          p256dh: p256dh,
          auth: auth
        })
        .where(eq(pushSubscriptions.employee_id, session.employeeId));

      console.log('✅ Subscription updated successfully');
    } else {
      console.log('🆕 Creating new subscription');
      
      // Create new subscription
      await db
        .insert(pushSubscriptions)
        .values({
          employee_id: session.employeeId,
          endpoint,
          p256dh: p256dh,
          auth: auth
        });

      console.log('✅ Subscription created successfully');
    }

    // Verify the subscription was saved
    const savedSubscription = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.employee_id, session.employeeId))
      .limit(1);

    if (savedSubscription.length === 0) {
      console.error('❌ Failed to save subscription to database');
      return NextResponse.json({ error: 'Failed to save subscription' }, { status: 500 });
    }

    console.log('✅ Subscription verified in database');

    return NextResponse.json({ 
      success: true, 
      message: 'Push subscription saved successfully',
      subscriptionId: savedSubscription[0].id
    });

  } catch (error) {
    console.error('❌ Error saving push subscription:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/notifications/subscribe - Get current subscription status
export async function GET(request: NextRequest) {
  try {
    // Get auth token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from session token
    const session = await sessionManager.getAuthSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get subscription for user
    const subscription = await db
      .select({
        id: pushSubscriptions.id,
        endpoint: pushSubscriptions.endpoint,
        created_at: pushSubscriptions.created_at,
        updated_at: pushSubscriptions.updated_at
      })
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.employee_id, session.employeeId))
      .limit(1);

    if (subscription.length === 0) {
      return NextResponse.json({ 
        subscribed: false,
        message: 'No subscription found'
      });
    }

    return NextResponse.json({ 
      subscribed: true,
      subscription: subscription[0]
    });

  } catch (error) {
    console.error('❌ Error getting subscription status:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// DELETE /api/notifications/subscribe - Unsubscribe from push notifications
export async function DELETE(request: NextRequest) {
  try {
    // Get auth token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from session token
    const session = await sessionManager.getAuthSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Delete subscription
    const result = await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.employee_id, session.employeeId));

    console.log('🗑️ Subscription deleted for employee:', session.employeeId);

    return NextResponse.json({ 
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    });

  } catch (error) {
    console.error('❌ Error deleting subscription:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Helper function to validate base64 encoding
function isValidBase64(str: string): boolean {
  if (!str || typeof str !== 'string') {
    return false;
  }
  
  // Check if it's URL-safe base64 (used by push subscriptions)
  // URL-safe base64 uses - and _ instead of + and /
  const urlSafeBase64Regex = /^[A-Za-z0-9\-_]+={0,2}$/;
  
  // Check if it's standard base64
  const standardBase64Regex = /^[A-Za-z0-9+/]+={0,2}$/;
  
  return urlSafeBase64Regex.test(str) || standardBase64Regex.test(str);
} 