import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { messages, groupMembers, employees, groups } from '@/lib/database/schema';
import { eq, desc, and } from 'drizzle-orm';
import { verifySession } from '@/lib/auth/session-manager';

// GET /api/messaging/groups/[id]/messages - Get group messages
export async function GET(
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

    // Get query parameters for pagination
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Single optimized query to get messages with membership check
    const groupMessages = await db
      .select({
        id: messages.id,
        content: messages.content,
        senderId: messages.senderId,
        senderName: employees.name,
        messageType: messages.messageType,
        createdAt: messages.createdAt,
        readBy: messages.readBy,
      })
      .from(messages)
      .leftJoin(employees, eq(messages.senderId, employees.empCode))
      .where(eq(messages.groupId, groupId))
      .orderBy(messages.createdAt) // Order ascending to avoid reverse
      .limit(limit)
      .offset(offset);

    // Quick membership check from the first message (if any exist)
    if (groupMessages.length > 0) {
      // Verify membership with a single query
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
    }

    // Skip marking as read on GET requests to improve performance
    // Mark as read only when user explicitly opens the chat or sends a message
    
    return NextResponse.json(groupMessages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
  }
}

// POST /api/messaging/groups/[id]/messages - Send a message
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
    const body = await request.json();
    const { content, messageType = 'text' } = body;

    if (!content) {
      return NextResponse.json({ error: 'Message content is required' }, { status: 400 });
    }

    // Check if user is a member of the group
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
      return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
    }

    // Create message
    const [newMessage] = await db
      .insert(messages)
      .values({
        groupId,
        senderId: session.employeeId,
        content,
        messageType,
        readBy: [session.employeeId], // Mark as read by sender
      })
      .returning();

    // Get sender info
    const [employee] = await db
      .select({
        name: employees.name,
      })
      .from(employees)
      .where(eq(employees.empCode, session.employeeId))
      .limit(1);

    // Update group's updatedAt timestamp
    await db
      .update(groups)
      .set({ updatedAt: new Date() })
      .where(eq(groups.id, groupId));

    if (!newMessage) {
      return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
    }

    return NextResponse.json({
      id: newMessage.id,
      content: newMessage.content,
      senderId: newMessage.senderId,
      senderName: employee?.name || session.employeeId,
      messageType: newMessage.messageType,
      createdAt: newMessage.createdAt,
      readBy: newMessage.readBy,
    });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json({ error: 'Failed to send message' }, { status: 500 });
  }
}