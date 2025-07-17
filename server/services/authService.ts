import crypto from "crypto";
import { Employee, InsertAuthSession, InsertOtpVerification, AuthSession, OtpVerification } from "@shared/schema";
import twilio from "twilio";

export class AuthService {
  private readonly IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
  private readonly twilioClient: twilio.Twilio;
  
  constructor() {
    // Initialize Twilio client
    this.twilioClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }

  // Generate a random 6-digit OTP
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Generate a secure session token
  generateSessionToken(): string {
    return crypto.randomBytes(32).toString("hex");
  }

  // Generate a unique session ID for OTP verification
  generateSessionId(): string {
    return crypto.randomUUID();
  }

  // Send OTP via Twilio SMS
  async sendOTP(phone: string, otp: string): Promise<{ success: boolean; message?: string; sessionId?: string; otp?: string }> {
    // For development, generate a fixed OTP and return it
    if (this.IS_DEVELOPMENT) {
      const developmentOTP = this.generateOTP();
      return {
        success: true,
        message: 'Development mode - OTP generated',
        sessionId: this.generateSessionId(),
        otp: developmentOTP
      };
    }

    try {
      // Generate OTP since we're not using an auto-generation service
      const generatedOTP = this.generateOTP();
      
      // Clean phone number (remove any non-digit characters)
      const cleanPhone = phone.replace(/[^\d]/g, "");
      
      // Format phone number for Twilio (assume Indian numbers)
      const formattedPhone = cleanPhone.startsWith("91") ? `+${cleanPhone}` : `+91${cleanPhone}`;
      
      console.log("Sending Twilio SMS OTP to:", formattedPhone);
      
      // Send SMS via Twilio
      const message = await this.twilioClient.messages.create({
        body: `Your SECL Employee Directory OTP is: ${generatedOTP}. Valid for 5 minutes. Do not share this code.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhone
      });

      console.log("Twilio SMS sent successfully:", message.sid);
      
      return { 
        success: true, 
        sessionId: this.generateSessionId(),
        otp: generatedOTP,
        message: `SMS sent to ${formattedPhone.replace(/(\+91)(\d{2})(\d{4})(\d{4})/, '$1$2****$4')}`
      };
    } catch (error: any) {
      console.error("Error sending Twilio SMS:", error);
      return { 
        success: false, 
        message: error.message || "Failed to send SMS via Twilio" 
      };
    }
  }

  // Verify OTP (local verification since we generate the OTP ourselves)
  async verifyOTP(sessionId: string, otp: string): Promise<{ success: boolean; message?: string }> {
    // With Twilio, we verify against the stored OTP in our database
    // This method is kept for compatibility but the actual verification 
    // happens in the routes.ts file by comparing with stored OTP
    return { success: true };
  }

  // Check if session is valid (not expired)
  isSessionValid(session: AuthSession): boolean {
    return new Date() < new Date(session.expiresAt);
  }

  // Check if OTP verification is valid (not expired)
  isOtpValid(verification: OtpVerification): boolean {
    return new Date() < new Date(verification.expiresAt);
  }

  // Get session expiry time (7 days from now)
  getSessionExpiryTime(): Date {
    const now = new Date();
    now.setDate(now.getDate() + 7);
    return now;
  }

  // Get OTP expiry time (5 minutes from now)
  getOtpExpiryTime(): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now;
  }

  // Get employee's primary phone number
  getEmployeePhone(employee: Employee): string | null {
    // Try phone1 first, then phone2
    return employee.phone1 || employee.phone2 || null;
  }

  // Validate phone number format
  isValidPhone(phone: string): boolean {
    const cleanPhone = phone.replace(/[^\d]/g, "");
    return cleanPhone.length === 10 || cleanPhone.length === 12; // 10 for Indian, 12 for with country code
  }
}

export const authService = new AuthService();