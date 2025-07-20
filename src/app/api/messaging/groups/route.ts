import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { groups, groupMembers, messages } from '@/lib/database/schema';
import { eq, desc, and, sql } from 'drizzle-orm';
import { verifySession } from '@/lib/auth/session-manager';

// GET /api/messaging/groups - Get user's groups with last message
export async function GET(request: NextRequest) {
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

    // Optimized single query to get all group data
    const userGroups = await db
      .select({
        id: groups.id,
        name: groups.name,
        description: groups.description,
        createdAt: groups.createdAt,
        updatedAt: groups.updatedAt,
        memberCount: sql<number>`(
          SELECT COUNT(DISTINCT gm2.employee_id) 
          FROM group_members gm2 
          WHERE gm2.group_id = ${groups.id}
        )`,
        lastMessage: sql<string | null>`(
          SELECT m.content 
          FROM messages m 
          WHERE m.group_id = ${groups.id} 
          ORDER BY m.created_at DESC 
          LIMIT 1
        )`,
        lastMessageTime: sql<Date | null>`(
          SELECT m.created_at 
          FROM messages m 
          WHERE m.group_id = ${groups.id} 
          ORDER BY m.created_at DESC 
          LIMIT 1
        )`,
        unreadCount: sql<number>`(
          SELECT COUNT(*) 
          FROM messages m 
          WHERE m.group_id = ${groups.id} 
          AND NOT (${session.employeeId} = ANY(m.read_by))
        )`,
      })
      .from(groups)
      .innerJoin(groupMembers, eq(groups.id, groupMembers.groupId))
      .where(eq(groupMembers.employeeId, session.employeeId))
      .orderBy(desc(groups.updatedAt));

    // Transform the results
    const groupsWithLastMessage = userGroups.map(group => ({
      id: group.id,
      name: group.name,
      description: group.description,
      memberCount: Number(group.memberCount) || 0,
      lastMessage: group.lastMessage || null,
      lastMessageTime: group.lastMessageTime || group.updatedAt,
      unreadCount: Number(group.unreadCount) || 0,
      createdAt: group.createdAt,
    }));

    return NextResponse.json(groupsWithLastMessage);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST /api/messaging/groups - Create a new group
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { name, description, memberIds } = body;

    if (!name || !memberIds || memberIds.length < 1) {
      return NextResponse.json(
        { error: 'Name and at least 1 member are required' },
        { status: 400 }
      );
    }

    // Ensure creator is included in members
    const allMemberIds = [...new Set([session.employeeId, ...memberIds])];
    
    console.log('Creating group with:', {
      name,
      description,
      createdBy: session.employeeId,
      allMemberIds
    });

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create group
      const now = new Date();
      const [newGroup] = await tx
        .insert(groups)
        .values({
          name,
          description,
          createdBy: session.employeeId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      // Add members
      if (newGroup) {
        const memberInserts = allMemberIds.map((employeeId) => ({
          groupId: newGroup.id,
          employeeId,
          role: employeeId === session.employeeId ? 'admin' : 'member',
          joinedAt: now,
        }));

        console.log('Inserting members:', memberInserts);
        
        await tx.insert(groupMembers).values(memberInserts);
      }

      return newGroup;
    });

    return NextResponse.json({
      success: true,
      group: result,
    });
  } catch (error) {
    console.error('Error creating group - Full error:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    // Return more specific error message
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return NextResponse.json({ 
      error: 'Failed to create group', 
      details: errorMessage 
    }, { status: 500 });
  }
}