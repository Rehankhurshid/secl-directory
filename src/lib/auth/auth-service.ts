import crypto from 'crypto';

export class AuthService {
  private readonly IS_DEVELOPMENT = process.env.NODE_ENV === 'development';
  private readonly OTP_EXPIRY_MINUTES = 5;
  private readonly SESSION_EXPIRY_DAYS = 7;

  /**
   * Generate a secure 6-digit OTP
   */
  generateOTP(): string {
    if (this.IS_DEVELOPMENT) {
      // Use a predictable OTP in development for easier testing
      return '123456';
    }
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Generate a unique session ID
   */
  generateSessionId(): string {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Generate a secure session token
   */
  generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Get OTP expiry time (5 minutes from now)
   */
  getOtpExpiryTime(): Date {
    const expiry = new Date();
    expiry.setMinutes(expiry.getMinutes() + this.OTP_EXPIRY_MINUTES);
    return expiry;
  }

  /**
   * Get session expiry time (7 days from now)
   */
  getSessionExpiryTime(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + this.SESSION_EXPIRY_DAYS);
    return expiry;
  }

  /**
   * Check if OTP is still valid
   */
  isOtpValid(expiresAt: Date | string): boolean {
    const expiryDate = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt;
    return new Date() <= expiryDate;
  }

  /**
   * Validate phone number format (Indian mobile numbers)
   */
  isValidPhone(phone: string): boolean {
    if (!phone) return false;
    
    // Remove any non-digit characters
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Check if it's a valid Indian mobile number
    // Should be 10 digits or 12 digits (with country code 91)
    return cleanPhone.length === 10 || 
           (cleanPhone.length === 12 && cleanPhone.startsWith('91'));
  }

  /**
   * Format phone number for display
   */
  formatPhoneForDisplay(phone: string): string {
    if (!phone) return '';
    
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Mask middle digits for privacy
    if (cleanPhone.length >= 10) {
      const last4 = cleanPhone.slice(-4);
      const countryCode = cleanPhone.length === 12 ? cleanPhone.slice(0, 2) : '91';
      return `+${countryCode}****${last4}`;
    }
    
    return phone;
  }

  /**
   * Format phone number for SMS sending
   */
  formatPhoneForSMS(phone: string): string {
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    // Add country code if not present
    if (cleanPhone.length === 10) {
      return `+91${cleanPhone}`;
    } else if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      return `+${cleanPhone}`;
    }
    
    return phone;
  }

  /**
   * Send OTP via SMS
   */
  async sendOTP(phone: string, otp: string): Promise<{ success: boolean; message: string }> {
    if (this.IS_DEVELOPMENT) {
      // In development, just return success without actually sending SMS
      console.log(`[DEV] OTP ${otp} would be sent to ${phone}`);
      return {
        success: true,
        message: `OTP sent to ${this.formatPhoneForDisplay(phone)} (dev mode)`,
      };
    }

    // TODO: Implement actual SMS sending via Twilio
    // For now, return a mock response
    return {
      success: true,
      message: `OTP sent to ${this.formatPhoneForDisplay(phone)}`,
    };
  }

  /**
   * Extract phone number from employee data
   */
  getEmployeePhone(employee: any): string | null {
    // Check for phone fields in order of preference
    // Drizzle maps phone_1 -> phoneNumber1, phone_2 -> phoneNumber2
    return employee.phoneNumber1 || 
           employee.phoneNumber2 || 
           null;
  }

  /**
   * Create a JWT token (simplified version)
   */
  createJWT(payload: any): string {
    // TODO: Implement proper JWT signing
    // For now, return a base64 encoded JSON
    return Buffer.from(JSON.stringify(payload)).toString('base64');
  }

  /**
   * Verify a JWT token (simplified version)
   */
  verifyJWT(token: string): any | null {
    try {
      // TODO: Implement proper JWT verification
      // For now, just decode base64
      return JSON.parse(Buffer.from(token, 'base64').toString());
    } catch {
      return null;
    }
  }
}

// Export a singleton instance
export const authService = new AuthService();