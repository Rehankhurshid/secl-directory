import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { LoginForm } from "@/components/auth/login-form";
import { OtpForm } from "@/components/auth/otp-form";
import { useAuth } from "@/hooks/use-auth";
import { ThemeToggle } from "@/components/theme-toggle";
import { usePWA } from "@/hooks/use-pwa";
import { useNativeNotifications } from "@/hooks/use-native-notifications";
import { EasterEggAnimation, useEasterEggAnimations } from "@/components/animations/easter-egg-animations";
import { Button } from "@/components/ui/button";
import { Loader2, RotateCcw, Bell } from "lucide-react";

export default function Login() {
  const [step, setStep] = useState<"login" | "otp">("login");
  const [sessionId, setSessionId] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [developmentOtp, setDevelopmentOtp] = useState<string>("");
  const { isAuthenticated, isLoading } = useAuth();
  const { hardRefresh } = usePWA();
  const [location, setLocation] = useLocation();
  const { showNotification, requestPermission, permission } = useNativeNotifications();
  const { activeAnimation, triggerAnimation, clearAnimation } = useEasterEggAnimations();

  // Redirect to directory if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLocation("/directory");
    }
  }, [isAuthenticated, setLocation]);

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Don't render the login form if already authenticated
  if (isAuthenticated) {
    return null;
  }

  const handleOtpSent = (sessionId: string, message: string, otp?: string) => {
    setSessionId(sessionId);
    setMessage(message);
    setDevelopmentOtp(otp || "");
    setStep("otp");
  };

  const handleOtpSuccess = () => {
    // The useVerifyOtp hook will handle the redirect through authentication state
    // No need to manually redirect here
  };

  const handleBack = () => {
    setStep("login");
    setSessionId("");
    setMessage("");
    setDevelopmentOtp("");
  };

  const handleTestNotification = async () => {
    if (permission === 'granted') {
      const success = await showNotification({
        title: 'Test Notification',
        body: 'This is a test message from SECL Employee Directory',
        requireInteraction: false,
        silent: false
      });
      
      if (success) {
        triggerAnimation('test-notification');
      }
    } else {
      const result = await requestPermission();
      if (result === 'granted') {
        const success = await showNotification({
          title: 'Test Notification',
          body: 'Notifications are now enabled! This is a test message.',
          requireInteraction: false,
          silent: false
        });
        
        if (success) {
          triggerAnimation('test-notification');
        }
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Easter egg animations */}
      {activeAnimation && (
        <EasterEggAnimation
          type={activeAnimation.type}
          trigger={activeAnimation.trigger}
          message={activeAnimation.message}
          onComplete={clearAnimation}
        />
      )}
      
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTestNotification}
          title="Test notification system"
        >
          <Bell className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={hardRefresh}
          title="Hard refresh - clears all cache"
        >
          <RotateCcw className="w-4 h-4" />
        </Button>
        <ThemeToggle />
      </div>
      
      <div className="w-full max-w-md px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
            SECL Employee Directory
          </h1>
          <p className="mt-2 text-muted-foreground">
            Secure access to employee information
          </p>
        </div>

        {step === "login" && (
          <LoginForm onOtpSent={handleOtpSent} />
        )}

        {step === "otp" && (
          <OtpForm
            sessionId={sessionId}
            message={message}
            developmentOtp={developmentOtp}
            onBack={handleBack}
            onSuccess={handleOtpSuccess}
          />
        )}
      </div>
    </div>
  );
}