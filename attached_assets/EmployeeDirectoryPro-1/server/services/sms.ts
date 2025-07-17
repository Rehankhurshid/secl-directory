import fetch from 'node-fetch';

interface Fast2SMSConfig {
  apiKey: string;
  senderId?: string;
  route?: 'q' | 'qt' | 'otp'; // q = Quick Transactional, qt = Quick Template, otp = OTP
}

interface SMSResponse {
  return: boolean;
  request_id: string;
  message: string[];
}

export class Fast2SMSService {
  private apiKey: string;
  private baseUrl = 'https://www.fast2sms.com/dev/bulkV2';
  private senderId: string;
  private route: string;

  constructor(config: Fast2SMSConfig) {
    this.apiKey = config.apiKey;
    this.senderId = config.senderId || 'FSTSMS';
    this.route = config.route || 'otp';
  }

  async sendOTP(phoneNumber: string, otp: string): Promise<boolean> {
    try {
      // Remove country code if present
      const cleanPhoneNumber = phoneNumber.replace(/^\+91/, '').replace(/[^0-9]/g, '');
      
      // Validate phone number
      if (cleanPhoneNumber.length !== 10) {
        console.error('Invalid phone number length:', cleanPhoneNumber);
        return false;
      }

      const message = `Your Employee Directory OTP is: ${otp}. Valid for 5 minutes.`;
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: this.route,
          sender_id: this.senderId,
          message: message,
          language: 'english',
          flash: 0,
          numbers: cleanPhoneNumber
        })
      });

      const data = await response.json() as SMSResponse;
      
      if (data.return) {
        console.log('SMS sent successfully:', data.request_id);
        return true;
      } else {
        console.error('SMS sending failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Fast2SMS error:', error);
      return false;
    }
  }

  async sendBulkOTP(phoneNumbers: string[], otp: string): Promise<boolean> {
    try {
      // Clean and validate all phone numbers
      const cleanNumbers = phoneNumbers
        .map(num => num.replace(/^\+91/, '').replace(/[^0-9]/g, ''))
        .filter(num => num.length === 10)
        .join(',');

      if (!cleanNumbers) {
        console.error('No valid phone numbers provided');
        return false;
      }

      const message = `Your Employee Directory OTP is: ${otp}. Valid for 5 minutes.`;
      
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'authorization': this.apiKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          route: this.route,
          sender_id: this.senderId,
          message: message,
          language: 'english',
          flash: 0,
          numbers: cleanNumbers
        })
      });

      const data = await response.json() as SMSResponse;
      
      if (data.return) {
        console.log('Bulk SMS sent successfully:', data.request_id);
        return true;
      } else {
        console.error('Bulk SMS sending failed:', data.message);
        return false;
      }
    } catch (error) {
      console.error('Fast2SMS bulk error:', error);
      return false;
    }
  }
}

// Initialize the service (will be used when API key is provided)
let smsService: Fast2SMSService | null = null;

export function initializeSMSService(apiKey: string): void {
  if (apiKey) {
    smsService = new Fast2SMSService({ apiKey });
    console.log('Fast2SMS service initialized');
  } else {
    console.log('Fast2SMS API key not provided, SMS sending disabled');
  }
}

export function getSMSService(): Fast2SMSService | null {
  return smsService;
}