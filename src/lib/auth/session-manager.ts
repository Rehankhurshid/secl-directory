import { db } from '@/lib/db';
import { otp_verifications, auth_sessions } from '@/lib/database/schema';
import { eq, and, lt } from 'drizzle-orm';
import { authService } from './auth-service';

export interface OtpVerification {
  id: number;
  employeeId: string;
  phone: string;
  otpCode: string;
  sessionId: string;
  expiresAt: Date;
  verified: boolean;
  createdAt: Date;
}

export interface AuthSession {
  id: number;
  employeeId: string;
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
}

export class SessionManager {
  /**
   * Create OTP verification record
   */
  async createOtpVerification(data: {
    employeeId: string;
    phone: string;
    otpCode: string;
    sessionId: string;
    expiresAt: Date;
  }): Promise<OtpVerification> {
    const [record] = await db.insert(otp_verifications).values({
      employee_id: data.employeeId,
      phone: data.phone,
      otp_code: data.otpCode,
      session_id: data.sessionId,
      expires_at: data.expiresAt,
      verified: false,
    }).returning();

    return {
      id: record.id,
      employeeId: record.employee_id,
      phone: record.phone,
      otpCode: record.otp_code,
      sessionId: record.session_id,
      expiresAt: record.expires_at,
      verified: record.verified,
      createdAt: record.created_at,
    };
  }

  /**
   * Get OTP verification by session ID
   */
  async getOtpVerificationBySessionId(sessionId: string): Promise<OtpVerification | null> {
    const [record] = await db
      .select()
      .from(otp_verifications)
      .where(eq(otp_verifications.session_id, sessionId));

    if (!record) return null;

    return {
      id: record.id,
      employeeId: record.employee_id,
      phone: record.phone,
      otpCode: record.otp_code,
      sessionId: record.session_id,
      expiresAt: record.expires_at,
      verified: record.verified,
      createdAt: record.created_at,
    };
  }

  /**
   * Mark OTP as verified
   */
  async markOtpVerified(sessionId: string): Promise<void> {
    await db
      .update(otp_verifications)
      .set({ verified: true })
      .where(eq(otp_verifications.session_id, sessionId));
  }

  /**
   * Create authentication session
   */
  async createAuthSession(data: {
    employeeId: string;
    sessionToken: string;
    expiresAt: Date;
  }): Promise<AuthSession> {
    const [record] = await db.insert(auth_sessions).values({
      employee_id: data.employeeId,
      session_token: data.sessionToken,
      expires_at: data.expiresAt,
    }).returning();

    return {
      id: record.id,
      employeeId: record.employee_id,
      sessionToken: record.session_token,
      expiresAt: record.expires_at,
      createdAt: record.created_at,
    };
  }

  /**
   * Get authentication session by token
   */
  async getAuthSessionByToken(sessionToken: string): Promise<AuthSession | null> {
    try {
      console.log('Looking for session with token:', sessionToken);
      
      const now = new Date();
      console.log('Current time:', now.toISOString());
      
      const [record] = await db
        .select()
        .from(auth_sessions)
        .where(eq(auth_sessions.session_token, sessionToken));

      console.log('Session query result:', record ? 'found' : 'not found');
      
      if (!record) return null;

      // Check if session is expired
      if (record.expires_at && new Date(record.expires_at) < now) {
        console.log('Session expired:', record.expires_at);
        return null;
      }

      return {
        id: record.id,
        employeeId: record.employee_id,
        sessionToken: record.session_token,
        expiresAt: record.expires_at,
        createdAt: record.created_at,
      };
    } catch (error) {
      console.error('Error fetching auth session:', error);
      throw error;
    }
  }

  /**
   * Delete authentication session
   */
  async deleteAuthSession(sessionToken: string): Promise<void> {
    await db
      .delete(auth_sessions)
      .where(eq(auth_sessions.session_token, sessionToken));
  }

  /**
   * Clean up expired OTP verifications
   */
  async cleanupExpiredOtps(): Promise<void> {
    await db
      .delete(otp_verifications)
      .where(lt(otp_verifications.expires_at, new Date()));
  }

  /**
   * Clean up expired authentication sessions
   */
  async cleanupExpiredSessions(): Promise<void> {
    await db
      .delete(auth_sessions)
      .where(lt(auth_sessions.expires_at, new Date()));
  }
  
  /**
   * Get session by token
   */
  async getSession(token: string): Promise<AuthSession | null> {
    const [session] = await db
      .select()
      .from(auth_sessions)
      .where(eq(auth_sessions.session_token, token))
      .limit(1);
    
    if (!session) return null;
    
    return {
      id: session.id,
      employeeId: session.employee_id,
      sessionToken: session.session_token,
      expiresAt: session.expires_at,
      createdAt: session.created_at,
    };
  }
}

// Export a singleton instance
export const sessionManager = new SessionManager();

/**
 * Verify session token and return session data
 */
export async function verifySession(token: string): Promise<{ employeeId: string } | null> {
  try {
    // For testing: If token is "test-token", return a test user
    if (token === 'test-token') {
      return { employeeId: '21497979' }; // Using the employee ID from the API response
    }
    
    // For now, extract employeeId from the token directly
    // In production, this should verify JWT or lookup session in database
    const session = await sessionManager.getSession(token);
    
    if (session && session.expiresAt > new Date()) {
      return { employeeId: session.employeeId };
    }
    
    return null;
  } catch (error) {
    console.error('Error verifying session:', error);
    return null;
  }
}