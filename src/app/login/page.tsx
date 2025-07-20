'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { LoginForm } from '@/components/auth/login-form';
import { OtpForm } from '@/components/auth/otp-form';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { Moon, Sun, RefreshCw, Bell } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/hooks/use-auth';
import { useQueryClient } from '@tanstack/react-query';

interface LoginResponse {
  success: boolean;
  sessionId: string;
  message: string;
  otp?: string; // Only in development mode
}

export default function LoginPage() {
  const [step, setStep] = useState<'login' | 'otp'>('login');
  const [sessionData, setSessionData] = useState<LoginResponse | null>(null);
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/employee-directory');
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLoginSuccess = (data: LoginResponse) => {
    setSessionData(data);
    setStep('otp');
  };

  const handleBack = () => {
    setStep('login');
    setSessionData(null);
  };

  const handleOtpSuccess = async () => {
    console.log('OTP verification successful, invalidating queries...');
    
    // Invalidate and refetch auth queries
    await queryClient.invalidateQueries({ queryKey: ['auth'] });
    await queryClient.refetchQueries({ queryKey: ['auth', 'me'] });
    
    // The AuthProvider will handle the redirect once the auth state is updated
    console.log('Auth state updated, AuthProvider will handle redirect');
  };

  const handleTestNotification = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('SECL Employee Directory', {
          body: 'This is a test notification',
          icon: '/icon-192x192.png',
        });
        toast({
          title: 'Notification sent!',
          description: 'Check your system notifications',
        });
      } else {
        toast({
          title: 'Permission denied',
          description: 'Please enable notifications in your browser settings',
          variant: 'destructive',
        });
      }
    }
  };

  const handleHardRefresh = () => {
    // Clear all local storage
    localStorage.clear();
    
    // Clear service worker cache
    if ('serviceWorker' in navigator) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Force reload
    window.location.reload();
  };

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      {/* Utility buttons */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleTestNotification}
          title="Test Notification"
        >
          <Bell className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleHardRefresh}
          title="Hard Refresh"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </div>

      {/* Main content */}
      <div className="w-full max-w-md">
        {step === 'login' ? (
          <LoginForm onSuccess={handleLoginSuccess} />
        ) : (
          <OtpForm
            sessionId={sessionData?.sessionId || ''}
            message={sessionData?.message || ''}
            developmentOtp={sessionData?.otp || ''}
            onSuccess={handleOtpSuccess}
            onBack={handleBack}
          />
        )}
      </div>
    </div>
  );
}