import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface DebugStep {
  name: string;
  status: 'pending' | 'success' | 'error';
  message?: string;
  details?: any;
}

export default function PushDebugPage() {
  const { employee } = useAuth();
  const { toast } = useToast();
  const [steps, setSteps] = useState<DebugStep[]>([
    { name: 'Service Worker Registration', status: 'pending' },
    { name: 'Firebase Initialization', status: 'pending' },
    { name: 'FCM Token Generation', status: 'pending' },
    { name: 'Notification Permission', status: 'pending' },
    { name: 'Server Subscription', status: 'pending' },
    { name: 'Test Notification', status: 'pending' }
  ]);
  const [fcmToken, setFcmToken] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);

  const updateStep = (name: string, update: Partial<DebugStep>) => {
    setSteps(prev => prev.map(step => 
      step.name === name ? { ...step, ...update } : step
    ));
  };

  const testDirectNotification = async () => {
    try {
      await apiRequest('/api/notifications/test', {
        method: 'POST',
        body: JSON.stringify({ 
          message: 'Direct test notification' 
        })
      });
      
      toast({
        title: "Test notification sent!",
        description: "Check your notifications to see if it was received.",
      });
    } catch (error) {
      console.error('Direct test notification error:', error);
      toast({
        title: "Test failed",
        description: "Make sure you're logged in and have push notifications enabled.",
        variant: "destructive",
      });
    }
  };

  const runDebugTest = async () => {
    setIsRunning(true);
    
    try {
      // Step 1: Check Service Worker
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        if (registration) {
          updateStep('Service Worker Registration', { 
            status: 'success', 
            message: 'Service worker is registered',
            details: { scope: registration.scope }
          });
        } else {
          // Try to register
          const reg = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
          updateStep('Service Worker Registration', { 
            status: 'success', 
            message: 'Service worker registered',
            details: { scope: reg.scope }
          });
        }
      } else {
        updateStep('Service Worker Registration', { 
          status: 'error', 
          message: 'Service workers not supported' 
        });
      }

      // Step 2: Check Firebase
      const { messaging } = await import('../firebase-config');
      if (messaging) {
        updateStep('Firebase Initialization', { 
          status: 'success', 
          message: 'Firebase messaging is initialized' 
        });
      } else {
        updateStep('Firebase Initialization', { 
          status: 'error', 
          message: 'Firebase messaging not initialized' 
        });
        return;
      }

      // Step 3: Check notification permission
      const permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';
      if (permission === 'granted') {
        updateStep('Notification Permission', { 
          status: 'success', 
          message: 'Notifications allowed' 
        });
      } else if (permission === 'denied') {
        updateStep('Notification Permission', { 
          status: 'error', 
          message: 'Notifications blocked' 
        });
        return;
      } else {
        // Request permission
        const result = typeof Notification !== 'undefined' ? await Notification.requestPermission() : 'denied';
        if (result === 'granted') {
          updateStep('Notification Permission', { 
            status: 'success', 
            message: 'Notifications allowed' 
          });
        } else {
          updateStep('Notification Permission', { 
            status: 'error', 
            message: 'Permission denied' 
          });
          return;
        }
      }

      // Step 4: Get FCM Token
      const { getToken } = await import('firebase/messaging');
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY
      });
      
      if (token) {
        setFcmToken(token);
        updateStep('FCM Token Generation', { 
          status: 'success', 
          message: 'Token generated',
          details: { token: token.substring(0, 20) + '...' }
        });
      } else {
        updateStep('FCM Token Generation', { 
          status: 'error', 
          message: 'Failed to generate token' 
        });
        return;
      }

      // Step 5: Subscribe on server
      const response = await apiRequest<any>('/api/notifications/subscribe', {
        method: 'POST',
        body: JSON.stringify({ token, type: 'fcm' })
      });

      if (response.success) {
        updateStep('Server Subscription', { 
          status: 'success', 
          message: 'Subscribed on server' 
        });
      } else {
        updateStep('Server Subscription', { 
          status: 'error', 
          message: 'Failed to subscribe - please login first' 
        });
        return;
      }

      // Step 6: Test notification
      updateStep('Test Notification', { 
        status: 'pending', 
        message: 'Sending test notification...' 
      });

      // Send a test message to yourself
      await apiRequest('/api/notifications/test', {
        method: 'POST',
        body: JSON.stringify({ 
          message: 'Test notification from Push Debug' 
        })
      });

      updateStep('Test Notification', { 
        status: 'success', 
        message: 'Test notification sent! Check your notifications.' 
      });

    } catch (error) {
      console.error('Debug test error:', error);
      toast({
        title: "Debug Error",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setIsRunning(false);
    }
  };



  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  if (employee?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="p-6">
          <p className="text-red-500">Admin access required</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Push Notification Debug</h1>
      
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold mb-4">Debug Steps</h2>
        <div className="space-y-3">
          {steps.map((step) => (
            <div key={step.name} className="flex items-start gap-3">
              {getStatusIcon(step.status)}
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{step.name}</span>
                  <Badge variant={
                    step.status === 'success' ? 'default' : 
                    step.status === 'error' ? 'destructive' : 
                    'secondary'
                  }>
                    {step.status}
                  </Badge>
                </div>
                {step.message && (
                  <p className="text-sm text-muted-foreground mt-1">{step.message}</p>
                )}
                {step.details && (
                  <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                    {JSON.stringify(step.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <Button 
            onClick={runDebugTest} 
            disabled={isRunning}
            className="w-full"
          >
            {isRunning ? 'Running Debug Test...' : 'Run Debug Test'}
          </Button>

          <Button 
            onClick={testDirectNotification}
            variant="outline"
            className="w-full"
          >
            Test Direct Notification
          </Button>
        </div>

        {fcmToken && (
          <div className="mt-6">
            <h3 className="font-medium mb-2">FCM Token:</h3>
            <pre className="text-xs bg-muted p-3 rounded break-all">
              {fcmToken}
            </pre>
          </div>
        )}
      </Card>

      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Environment Info</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="font-medium">Service Worker Support:</dt>
            <dd>{'serviceWorker' in navigator ? 'Yes' : 'No'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Notification API Support:</dt>
            <dd>{'Notification' in window ? 'Yes' : 'No'}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">Permission Status:</dt>
            <dd>{Notification.permission}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="font-medium">User Agent:</dt>
            <dd className="text-xs truncate max-w-xs">{navigator.userAgent}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}