import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginRequestSchema, LoginRequest } from "@shared/schema";
import { useLogin } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, User, Phone } from "lucide-react";

interface LoginFormProps {
  onOtpSent: (sessionId: string, message: string, otp?: string) => void;
}

export function LoginForm({ onOtpSent }: LoginFormProps) {
  const [error, setError] = useState<string | null>(null);
  const login = useLogin();

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginRequestSchema),
    defaultValues: {
      employeeId: "",
    },
  });

  const onSubmit = async (data: LoginRequest) => {
    setError(null);
    
    try {
      const response = await login.mutateAsync(data);
      onOtpSent(response.sessionId, response.message, response.otp);
    } catch (err: any) {
      setError(err.message || "Failed to send OTP");
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Employee Login</CardTitle>
        <CardDescription>
          Enter your employee ID to receive an OTP on your registered phone number
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee ID</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="employeeId"
                type="text"
                placeholder="Enter your employee ID"
                className="pl-10"
                {...form.register("employeeId")}
              />
            </div>
            {form.formState.errors.employeeId && (
              <p className="text-sm text-red-500">
                {form.formState.errors.employeeId.message}
              </p>
            )}
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={login.isPending}
          >
            {login.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending OTP...
              </>
            ) : (
              <>
                <Phone className="mr-2 h-4 w-4" />
                Send OTP
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-muted-foreground">
          <p>How it works:</p>
          <ol className="mt-2 space-y-1 text-xs">
            <li>1. Enter your employee ID</li>
            <li>2. Receive OTP on your registered phone</li>
            <li>3. Enter the 6-digit code to login</li>
            <li>4. Stay logged in for 7 days</li>
          </ol>
        </div>
      </CardContent>
    </Card>
  );
}