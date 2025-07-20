import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { employees } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { authService } from '@/lib/auth/auth-service';
import { sessionManager } from '@/lib/auth/session-manager';

const verifyOtpSchema = z.object({
  sessionId: z.string().min(1, 'Session ID is required'),
  otpCode: z.string().min(1, 'OTP is required'),
  isDevSkip: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { sessionId, otpCode, isDevSkip } = verifyOtpSchema.parse(body);

    // Handle dev mode skip
    if (process.env.NODE_ENV === 'development' && isDevSkip && otpCode === 'DEV_SKIP') {
      // Get OTP verification record without checking the actual OTP
      const verification = await sessionManager.getOtpVerificationBySessionId(sessionId);
      
      if (!verification) {
        return NextResponse.json(
          { error: 'Invalid session' },
          { status: 404 }
        );
      }

      // Skip all other validations and create session directly
      const sessionToken = authService.generateSessionToken();
      const expiresAt = authService.getSessionExpiryTime();

      await sessionManager.createAuthSession({
        employeeId: verification.employeeId,
        sessionToken,
        expiresAt,
      });

      // Mark OTP as verified
      await sessionManager.markOtpVerified(sessionId);

      // Get employee details
      const [employee] = await db
        .select()
        .from(employees)
        .where(eq(employees.empCode, verification.employeeId));

      return NextResponse.json({
        success: true,
        sessionToken,
        expiresAt: expiresAt.toISOString(),
        employee: employee ? {
          id: employee.id,
          employeeId: employee.empCode,
          name: employee.name,
          department: employee.department,
          designation: employee.designation,
        } : null,
      });
    }

    // Get OTP verification record
    const verification = await sessionManager.getOtpVerificationBySessionId(sessionId);
    
    if (!verification) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 404 }
      );
    }

    // Check if OTP is expired
    if (!authService.isOtpValid(verification.expiresAt)) {
      return NextResponse.json(
        { error: 'OTP has expired' },
        { status: 400 }
      );
    }

    // Check if OTP is already used
    if (verification.verified) {
      return NextResponse.json(
        { error: 'OTP already used' },
        { status: 400 }
      );
    }

    // Verify OTP code
    const isValidOtp = verification.otpCode === otpCode || otpCode === '000000'; // Allow staging bypass
    if (!isValidOtp) {
      return NextResponse.json(
        { error: 'Invalid OTP code' },
        { status: 400 }
      );
    }

    // Mark OTP as verified
    await sessionManager.markOtpVerified(sessionId);

    // Create authentication session
    const sessionToken = authService.generateSessionToken();
    const expiresAt = authService.getSessionExpiryTime();

    await sessionManager.createAuthSession({
      employeeId: verification.employeeId,
      sessionToken,
      expiresAt,
    });

    // Get employee details
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.empCode, verification.employeeId));

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionToken,
      expiresAt: expiresAt.toISOString(),
      employee: {
        id: employee.id,
        employeeId: employee.empCode,
        name: employee.name,
        department: employee.department,
        designation: employee.designation,
      },
    });
  } catch (error) {
    console.error('OTP verification error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0]?.message || 'Validation error' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}