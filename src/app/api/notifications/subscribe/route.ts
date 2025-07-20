import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { pushSubscriptions, employees } from '@/lib/database/schema';
import { eq, and } from 'drizzle-orm';
import { sessionManager } from '@/lib/auth/session-manager';

export async function POST(request: NextRequest) {
  try {
    // Get auth token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from session token
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { endpoint, keys } = body;

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Check if subscription already exists
    const existingSubscription = await db
      .select()
      .from(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.employee_id, user.empCode),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      )
      .limit(1);

    if (existingSubscription.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          p256dh: keys.p256dh,
          auth: keys.auth,
        })
        .where(eq(pushSubscriptions.id, existingSubscription[0].id));

      return NextResponse.json({
        success: true,
        message: 'Subscription updated successfully',
      });
    } else {
      // Create new subscription
      await db.insert(pushSubscriptions).values({
        employee_id: user.empCode,
        endpoint,
        p256dh: keys.p256dh,
        auth: keys.auth,
      });

      return NextResponse.json({
        success: true,
        message: 'Subscription created successfully',
      });
    }
  } catch (error) {
    console.error('❌ Push subscription error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get auth token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from session token
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Delete subscription
    await db
      .delete(pushSubscriptions)
      .where(
        and(
          eq(pushSubscriptions.employee_id, user.empCode),
          eq(pushSubscriptions.endpoint, endpoint)
        )
      );

    return NextResponse.json({
      success: true,
      message: 'Subscription removed successfully',
    });
  } catch (error) {
    console.error('❌ Push unsubscribe error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to get user from token
async function getUserFromToken(token: string) {
  try {
    // Get session from token
    const session = await sessionManager.getAuthSessionByToken(token);
    if (!session) {
      return null;
    }

    // Get employee details
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.empCode, session.employeeId));

    if (!employee) {
      return null;
    }

    return employee;
  } catch (error) {
    console.error('❌ Error getting user from token:', error);
    return null;
  }
} 