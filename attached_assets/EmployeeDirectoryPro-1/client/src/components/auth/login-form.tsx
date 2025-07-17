import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useAuth } from "@/hooks/use-auth";
import { IdentificationCard, Key } from "@phosphor-icons/react";

const loginSchema = z.object({
  employeeId: z.string().min(1, "Employee ID is required"),
  otpCode: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const [step, setStep] = useState<"employee-id" | "otp">("employee-id");
  const [devOtp, setDevOtp] = useState<string>("");
  const { generateOtp, isGeneratingOtp, login, isLoginLoading } = useAuth();

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      employeeId: "",
      otpCode: "",
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    if (step === "employee-id") {
      generateOtp(data.employeeId, {
        onSuccess: (response: any) => {
          if (response.devOtp) {
            setDevOtp(response.devOtp);
          }
          setStep("otp");
        },
      });
    } else {
      if (data.otpCode) {
        login({ employeeId: data.employeeId, otpCode: data.otpCode });
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="employeeId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Employee ID</FormLabel>
              <FormControl>
                <div className="relative">
                  <IdentificationCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                  <Input 
                    {...field} 
                    placeholder="Enter your employee ID"
                    disabled={step === "otp"}
                    className="pl-10"
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {step === "otp" && (
          <FormField
            control={form.control}
            name="otpCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>OTP Code</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={16} />
                    <Input 
                      {...field} 
                      placeholder="Enter 6-digit OTP"
                      maxLength={6}
                      type="number"
                      className="pl-10"
                    />
                  </div>
                </FormControl>
                <FormMessage />
                <p className="text-sm text-muted-foreground mt-1">
                  OTP sent to your registered mobile number
                </p>
                {process.env.NODE_ENV === 'development' && devOtp && (
                  <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
                    <p className="text-sm text-yellow-800 dark:text-yellow-200">
                      <strong>Development Mode:</strong> Your OTP is <code className="font-mono font-bold text-lg">{devOtp}</code>
                    </p>
                  </div>
                )}
              </FormItem>
            )}
          />
        )}

        <Button 
          type="submit" 
          className="w-full" 
          disabled={isGeneratingOtp || isLoginLoading}
        >
          {isGeneratingOtp || isLoginLoading ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              {step === "employee-id" ? "Sending OTP..." : "Verifying..."}
            </>
          ) : (
            step === "employee-id" ? "Send OTP" : "Verify OTP"
          )}
        </Button>

        {step === "otp" && (
          <Button 
            type="button" 
            variant="outline" 
            className="w-full"
            onClick={() => setStep("employee-id")}
          >
            Back to Employee ID
          </Button>
        )}
      </form>
    </Form>
  );
}
