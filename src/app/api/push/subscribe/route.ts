import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { pushSubscriptions } from '@/lib/database/schema'
import { eq } from 'drizzle-orm'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export async function POST(req: NextRequest) {
  try {
    // Get token from header
    const authHeader = req.headers.get('authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const token = authHeader.split(' ')[1]
    if (!token || !JWT_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const decoded = jwt.verify(token, JWT_SECRET) as any
    const employeeId = decoded.sub

    // Get subscription from body
    const { subscription } = await req.json()

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 })
    }

    // Check if subscription exists
    const existing = await db
      .select()
      .from(pushSubscriptions)
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
      .limit(1)

    if (existing.length > 0) {
      // Update existing subscription
      await db
        .update(pushSubscriptions)
        .set({
          employeeId,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          updatedAt: new Date()
        })
        .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
    } else {
      // Create new subscription
      await db
        .insert(pushSubscriptions)
        .values({
          employeeId,
          endpoint: subscription.endpoint,
          p256dh: subscription.keys.p256dh,
          auth: subscription.keys.auth,
          platform: 'web'
        })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Failed to save push subscription:', error)
    
    // Check for common database errors
    if (error.code === '42P01') {
      console.error('Table push_subscriptions does not exist. Run: npm run db:migrate')
      return NextResponse.json({ 
        error: 'Database table missing. Please run migrations.', 
        details: 'push_subscriptions table not found' 
      }, { status: 500 })
    }
    
    if (error.code === '23505') {
      // Unique constraint violation - subscription already exists
      return NextResponse.json({ 
        error: 'Subscription already exists', 
        details: 'This device is already subscribed' 
      }, { status: 409 })
    }
    
    return NextResponse.json({ 
      error: 'Failed to save subscription', 
      details: error.message 
    }, { status: 500 })
  }
}