import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyOtpSchema, VerifyOtpRequest } from "@shared/schema";
import { useVerifyOtp } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Shield, ArrowLeft } from "lucide-react";

interface OtpFormProps {
  sessionId: string;
  message: string;
  developmentOtp?: string;
  onBack: () => void;
  onSuccess: () => void;
}

export function OtpForm({ sessionId, message, developmentOtp, onBack, onSuccess }: OtpFormProps) {
  const [error, setError] = useState<string | null>(null);
  const verifyOtp = useVerifyOtp();

  const form = useForm<VerifyOtpRequest>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: {
      sessionId,
      otpCode: "",
    },
  });

  const onSubmit = async (data: VerifyOtpRequest) => {
    setError(null);
    
    try {
      await verifyOtp.mutateAsync(data);
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to verify OTP");
    }
  };

  const handleStagingBypass = async () => {
    setError(null);
    
    try {
      // Use a special bypass code for staging
      await verifyOtp.mutateAsync({
        sessionId,
        otpCode: "000000" // Staging bypass code
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to bypass OTP");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Verify OTP</CardTitle>
        <CardDescription>
          {message}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="otpCode">6-Digit OTP Code</Label>
            <div className="relative">
              <Shield className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="otpCode"
                type="text"
                placeholder="Enter 6-digit OTP"
                className="pl-10 text-center text-lg tracking-widest"
                maxLength={6}
                {...form.register("otpCode")}
                autoComplete="one-time-code"
              />
            </div>
            {form.formState.errors.otpCode && (
              <p className="text-sm text-red-500">
                {form.formState.errors.otpCode.message}
              </p>
            )}
            {developmentOtp && (
              <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Development Mode:</strong> Your OTP is: <span className="font-mono text-lg">{developmentOtp}</span>
                </p>
              </div>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Button
              type="submit"
              className="w-full"
              disabled={verifyOtp.isPending}
            >
              {verifyOtp.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify & Login
                </>
              )}
            </Button>

            <Button
              type="button"
              variant="secondary"
              className="w-full"
              onClick={handleStagingBypass}
              disabled={verifyOtp.isPending}
            >
              Skip OTP (Staging)
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={onBack}
              disabled={verifyOtp.isPending}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Login
            </Button>
          </div>
        </form>

        <div className="mt-4 text-center text-sm text-muted-foreground">
          <p>OTP expires in 5 minutes</p>
          <p className="mt-1">Didn't receive? Check your SMS inbox or try again</p>
        </div>
      </CardContent>
    </Card>
  );
}