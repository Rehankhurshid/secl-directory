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

    // Delete all subscriptions for this employee
    await db
      .delete(pushSubscriptions)
      .where(eq(pushSubscriptions.employeeId, employeeId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to remove push subscription:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}