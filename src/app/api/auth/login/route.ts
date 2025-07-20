import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { employees } from '@/lib/database/schema';
import { eq } from 'drizzle-orm';
import { authService } from '@/lib/auth/auth-service';
import { sessionManager } from '@/lib/auth/session-manager';

const loginRequestSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    const { employeeId } = loginRequestSchema.parse(body);

    // Find employee by ID
    const [employee] = await db
      .select()
      .from(employees)
      .where(eq(employees.empCode, employeeId));

    if (!employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      );
    }

    // Check if employee is active
    if (!employee.isActive) {
      return NextResponse.json(
        { error: 'Employee account is inactive' },
        { status: 403 }
      );
    }

    // Get employee's phone number
    const phone = authService.getEmployeePhone(employee);
    if (!phone) {
      return NextResponse.json(
        { error: 'No phone number found for this employee' },
        { status: 400 }
      );
    }

    // Validate phone number format
    if (!authService.isValidPhone(phone)) {
      return NextResponse.json(
        { error: 'Invalid phone number format' },
        { status: 400 }
      );
    }

    // Generate OTP and session ID
    const otp = authService.generateOTP();
    const sessionId = authService.generateSessionId();

    // Send OTP via SMS
    const smsResult = await authService.sendOTP(phone, otp);
    if (!smsResult.success) {
      return NextResponse.json(
        { error: 'Failed to send OTP' },
        { status: 500 }
      );
    }

    // Store OTP verification record
    await sessionManager.createOtpVerification({
      employeeId: employee.empCode,
      phone,
      otpCode: otp,
      sessionId,
      expiresAt: authService.getOtpExpiryTime(),
    });

    // Prepare response
    const response: any = {
      success: true,
      sessionId,
      message: `OTP sent to ${authService.formatPhoneForDisplay(phone)}`,
    };

    // In development mode, include the OTP
    if (process.env.NODE_ENV === 'development') {
      response.otp = otp;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Login error:', error);

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