import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, groups, groupMembers } from '@/lib/database/schema';
import { eq, desc, and } from 'drizzle-orm';
import { sessionManager } from '@/lib/auth/session-manager';
import { pushNotificationService } from '@/lib/services/push-notification-service';

// GET /api/messaging/groups/[id]/messages - Get messages for a group
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from session token
    const session = await sessionManager.getAuthSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const groupId = parseInt(params.id, 10);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    // Check if user is a member of this group
    const membership = await db
      .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.groupId, groupId),
            eq(groupMembers.employeeId, session.employeeId)
          )
        )
        .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Get query parameters for pagination
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '50', 10);
    const offset = parseInt(url.searchParams.get('offset') || '0', 10);

    // Fetch messages for the group
    const groupMessages = await db
      .select()
      .from(messages)
      .where(eq(messages.groupId, groupId))
      .orderBy(desc(messages.createdAt))
      .limit(limit)
      .offset(offset);
    
    return NextResponse.json({
      messages: groupMessages.reverse(), // Reverse to show oldest first
      hasMore: groupMessages.length === limit,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/messaging/groups/[id]/messages - Send a new message
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get auth token from header
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from session token
    const session = await sessionManager.getAuthSessionByToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const groupId = parseInt(params.id, 10);
    if (isNaN(groupId)) {
      return NextResponse.json({ error: 'Invalid group ID' }, { status: 400 });
    }

    // Check if user is a member of this group
    const membership = await db
      .select()
      .from(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.employeeId, session.employeeId)
        )
      )
      .limit(1);

    if (membership.length === 0) {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    const body = await request.json();
    const { content, type = 'text' } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      );
    }

    // Insert the new message
    const [newMessage] = await db
      .insert(messages)
      .values({
        groupId,
        senderId: session.employeeId,
        content: content.trim(),
        messageType: type,
        status: 'sent',
      })
      .returning();

    // Get group info for notification
    const [groupInfo] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, groupId))
      .limit(1);

    // Send push notifications to group members (excluding sender)
    // Run this asynchronously so it doesn't block the response
    setImmediate(async () => {
      try {
        await pushNotificationService.sendToGroupMembers(
          groupId,
          session.employeeId,
          {
            title: groupInfo?.name || `Group Message`,
            body: content.length > 50 ? content.substring(0, 50) + '...' : content,
            icon: '/icon-192x192.png',
            data: {
              groupId: groupId,
              messageId: newMessage.id,
              senderId: session.employeeId,
              type: 'group_message',
            },
          }
        );
        console.log(`📬 Push notifications sent for message: ${newMessage.id}`);
      } catch (error) {
        console.error('❌ Error sending push notifications:', error);
      }
    });

    return NextResponse.json({
      message: newMessage,
      success: true,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}