'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Loader2, ArrowLeft, Zap, RefreshCw } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';

const otpSchema = z.object({
  otpCode: z.string().length(6, 'OTP must be 6 digits'),
});

type OtpFormData = z.infer<typeof otpSchema>;

interface OtpFormProps {
  sessionId: string;
  message: string;
  developmentOtp?: string;
  onSuccess: () => void;
  onBack: () => void;
}

export function OtpForm({ sessionId, message, developmentOtp, onSuccess, onBack }: OtpFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendTimer, setResendTimer] = useState(0);
  const otpInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<OtpFormData>({
    resolver: zodResolver(otpSchema),
    defaultValues: {
      otpCode: '',
    },
  });

  useEffect(() => {
    // Auto-focus OTP input
    form.setFocus('otpCode');

    // Start resend timer (60 seconds)
    setResendTimer(60);
    const interval = setInterval(() => {
      setResendTimer(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(interval);
  }, [form]);

  const onSubmit = async (data: OtpFormData) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          otpCode: data.otpCode,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to verify OTP');
      }

      // Store session token
      console.log('Storing session token:', result.sessionToken);
      localStorage.setItem('sessionToken', result.sessionToken);
      localStorage.setItem('sessionExpiry', result.expiresAt);
      
      console.log('Calling onSuccess callback...');
      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStagingBypass = async () => {
    form.setValue('otpCode', '000000');
    form.handleSubmit(onSubmit)();
  };

  const handleDevSkipOTP = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          otpCode: 'DEV_SKIP',
          isDevSkip: true,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to skip OTP');
      }

      // Store session token
      console.log('Storing session token:', result.sessionToken);
      localStorage.setItem('sessionToken', result.sessionToken);
      localStorage.setItem('sessionExpiry', result.expiresAt);
      
      console.log('Calling onSuccess callback...');
      onSuccess();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOTP = async () => {
    // TODO: Implement resend OTP functionality
    setResendTimer(60);
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center space-y-1">
        <div className="flex justify-center mb-4">
          <div className="p-3 bg-primary/10 rounded-full">
            <Shield className="h-8 w-8 text-primary" />
          </div>
        </div>
        <CardTitle className="text-2xl font-bold">Verify OTP</CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="otpCode"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Enter OTP</FormLabel>
                  <FormControl>
                    <InputOTP
                      maxLength={6}
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isLoading}
                    >
                      <InputOTPGroup>
                        <InputOTPSlot index={0} />
                        <InputOTPSlot index={1} />
                        <InputOTPSlot index={2} />
                        <InputOTPSlot index={3} />
                        <InputOTPSlot index={4} />
                        <InputOTPSlot index={5} />
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

          {/* Development OTP Display */}
          {developmentOtp && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Development Mode:</strong> Your OTP is:{' '}
                <span className="font-mono text-lg font-bold">{developmentOtp}</span>
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify OTP'
              )}
            </Button>

            {/* Dev Mode Skip Button */}
            {process.env.NODE_ENV === 'development' && (
              <Button
                type="button"
                variant="destructive"
                className="w-full"
                onClick={handleDevSkipOTP}
                disabled={isLoading}
              >
                <Zap className="mr-2 h-4 w-4" />
                Dev Mode: Skip OTP
              </Button>
            )}

            {/* Staging Bypass Button */}
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleStagingBypass}
              disabled={isLoading}
            >
              Staging Bypass (000000)
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={onBack}
                disabled={isLoading}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="flex-1"
                onClick={handleResendOTP}
                disabled={isLoading || resendTimer > 0}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                {resendTimer > 0 ? `Resend (${resendTimer}s)` : 'Resend OTP'}
              </Button>
            </div>
          </div>
          </form>
        </Form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>Didn't receive the OTP?</p>
          <p>Check your registered phone number or contact IT support</p>
        </div>
      </CardContent>
    </Card>
  );
}