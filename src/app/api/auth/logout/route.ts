import { NextRequest, NextResponse } from 'next/server';
import { sessionManager } from '@/lib/auth/session-manager';

export async function POST(request: NextRequest) {
  try {
    // Get session token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // If no auth header, still return success (idempotent)
      return NextResponse.json({ success: true });
    }

    const sessionToken = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Delete the session
    await sessionManager.deleteAuthSession(sessionToken);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);

    // Even on error, return success (idempotent operation)
    return NextResponse.json({ success: true });
  }
}