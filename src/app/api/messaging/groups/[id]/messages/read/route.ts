import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, groupMembers } from '@/lib/database/schema';
import { eq, and, sql } from 'drizzle-orm';
import { verifySession } from '@/lib/auth/session-manager';

// POST /api/messaging/groups/[id]/messages/read - Mark messages as read
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const session = await verifySession(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const groupId = parseInt(params.id);

    // Verify membership
    const [membership] = await db
      .select({ id: groupMembers.id })
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.employeeId, session.employeeId)
        )
      )
      .limit(1);

    if (!membership) {
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    // Mark all messages in the group as read by this user
    // Using raw SQL for array operations
    await db.execute(sql`
      UPDATE messages 
      SET 
        read_by = array_append(read_by, ${session.employeeId}),
        updated_at = ${new Date()}
      WHERE 
        group_id = ${groupId} 
        AND NOT (${session.employeeId} = ANY(read_by))
    `);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    return NextResponse.json({ error: 'Failed to mark messages as read' }, { status: 500 });
  }
}