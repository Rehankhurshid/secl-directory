import { NextRequest, NextResponse } from 'next/server';
import { pushNotificationService } from '@/lib/services/push-notification-service';
import { sessionManager } from '@/lib/auth/session-manager';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Test notification endpoint called');
    
    // Get auth token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      console.log('❌ No authorization token provided');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from session token
    const session = await sessionManager.getAuthSessionByToken(token);
    if (!session) {
      console.log('❌ Invalid session token');
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    console.log(`🧪 Sending test notification to employee: ${session.employeeId}`);

    // Get current subscriptions for debugging
    const currentSubscriptions = await pushNotificationService.getSubscriptionsForEmployee(session.employeeId);
    console.log(`📱 Current subscriptions for ${session.employeeId}:`, currentSubscriptions);

    if (currentSubscriptions.length === 0) {
      console.log(`❌ No push subscriptions found for employee: ${session.employeeId}`);
      return NextResponse.json({ 
        error: 'No subscription found',
        message: 'Please ensure you have allowed notifications and the PWA is properly installed.',
        employeeId: session.employeeId,
        subscriptionsCount: 0
      }, { status: 404 });
    }

    // Send test notification
    const success = await pushNotificationService.sendTestNotification(session.employeeId);

    if (success) {
      console.log(`✅ Test notification sent successfully to: ${session.employeeId}`);
      return NextResponse.json({
        success: true,
        message: 'Test notification sent successfully!',
        employeeId: session.employeeId,
        subscriptionsCount: currentSubscriptions.length,
        subscriptions: currentSubscriptions
      });
    } else {
      console.log(`❌ Failed to send test notification to: ${session.employeeId}`);
      return NextResponse.json({
        error: 'Failed to send notification',
        message: 'The notification could not be sent. Please check your subscription.',
        employeeId: session.employeeId,
        subscriptionsCount: currentSubscriptions.length
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Test notification error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: 'An error occurred while sending the test notification.',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET endpoint to check push notification status
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await sessionManager.getAuthSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Check if VAPID keys are configured
    const vapidConfigured = !!(
      process.env.VAPID_PUBLIC_KEY && 
      process.env.VAPID_PRIVATE_KEY && 
      process.env.VAPID_EMAIL
    );

    return NextResponse.json({
      vapidConfigured,
      userId: session.employeeId,
      environment: {
        hasVapidPublic: !!process.env.VAPID_PUBLIC_KEY,
        hasVapidPrivate: !!process.env.VAPID_PRIVATE_KEY,
        hasVapidEmail: !!process.env.VAPID_EMAIL,
      }
    });

  } catch (error) {
    console.error('❌ Status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check status' },
      { status: 500 }
    );
  }
} 