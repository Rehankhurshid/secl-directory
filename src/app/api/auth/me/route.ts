import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { employees } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { sessionManager } from '@/lib/auth/session-manager';

export async function GET(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    console.log('Auth header:', authHeader ? 'present' : 'missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    const sessionToken = authHeader.substring(7); // Remove 'Bearer ' prefix
    console.log('Session token:', sessionToken);

    // Validate session
    let session;
    try {
      session = await sessionManager.getAuthSessionByToken(sessionToken);
      console.log('Session found:', session ? 'yes' : 'no');
    } catch (sessionError) {
      console.error('Error getting session:', sessionError);
      return NextResponse.json(
        { error: 'Database error while validating session' },
        { status: 500 }
      );
    }
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid or expired session' },
        { status: 401 }
      );
    }

    // Get employee details
    console.log('Fetching employee with ID:', session.employeeId);
    
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.empCode, session.employeeId));

    console.log('Employee found:', employee ? 'yes' : 'no');

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Return employee profile (excluding sensitive data)
    return NextResponse.json({
      employee: {
        id: employee.id,
        empCode: employee.empCode,
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
        emailId: employee.emailId,
        // Add other non-sensitive fields as needed
      },
    });
  } catch (error) {
    console.error('Session validation error:', error);
    console.error('Error details:', error instanceof Error ? error.message : 'Unknown error');

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}