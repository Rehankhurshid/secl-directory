import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import { auth_sessions } from '@/lib/database/schema';
import { eq, and, gte } from 'drizzle-orm';

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get('sessionToken')?.value;

  if (!sessionToken) {
    return null;
  }

  const session = await db
    .select()
    .from(auth_sessions)
    .where(
      and(
        eq(auth_sessions.session_token, sessionToken),
        gte(auth_sessions.expires_at, new Date())
      )
    )
    .limit(1);

  if (!session.length || !session[0]) {
    return null;
  }

  return {
    userId: session[0].employee_id,
    sessionToken: session[0].session_token,
  };
}