'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/lib/hooks/use-auth';

export function PushNotificationDebug() {
  const { employee, isAuthenticated } = useAuth();
  const [status, setStatus] = useState({
    permission: 'default' as NotificationPermission,
    serviceWorker: false,
    subscription: false,
    vapidConfigured: false,
    isLoading: true
  });

  useEffect(() => {
    checkStatus();
  }, [isAuthenticated]);

  const checkStatus = async () => {
    setStatus(prev => ({ ...prev, isLoading: true }));

    try {
      // Check notification permission
      const permission = 'Notification' in window ? Notification.permission : 'denied';
      
      // Check service worker
      let swRegistered = false;
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        swRegistered = !!registration;
      }

      // Check push subscription
      let hasSubscription = false;
      if (swRegistered) {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        hasSubscription = !!subscription;
      }

      // Check VAPID configuration (if logged in)
      let vapidOk = false;
      const token = localStorage.getItem('sessionToken');
      if (token) {
        try {
          const response = await fetch('/api/notifications/test', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            vapidOk = data.vapidConfigured;
          }
        } catch (error) {
          console.error('Error checking VAPID:', error);
        }
      }

      setStatus({
        permission,
        serviceWorker: swRegistered,
        subscription: hasSubscription,
        vapidConfigured: vapidOk,
        isLoading: false
      });
    } catch (error) {
      console.error('Error checking status:', error);
      setStatus(prev => ({ ...prev, isLoading: false }));
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      toast.error('Notifications not supported in this browser');
      return;
    }

    const permission = await Notification.requestPermission();
    setStatus(prev => ({ ...prev, permission }));
    
    if (permission === 'granted') {
      toast.success('✅ Notification permission granted!');
      // Try to create subscription
      await createSubscription();
    } else {
      toast.error('❌ Notification permission denied');
    }
  };

  const createSubscription = async () => {
    const token = localStorage.getItem('sessionToken');
    if (!token) {
      toast.error('Please log in first');
      return;
    }

    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Get VAPID public key
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidPublicKey) {
        toast.error('VAPID public key not configured');
        return;
      }

      // Create subscription
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlB64ToUint8Array(vapidPublicKey)
      });

      // Save subscription to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription.toJSON())
      });

      if (response.ok) {
        toast.success('✅ Push subscription created!');
        await checkStatus();
      } else {
        const error = await response.json();
        toast.error(`Failed to save subscription: ${error.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating subscription:', error);
      toast.error('Failed to create push subscription');
    }
  };

  const sendTestNotification = async () => {
    const token = localStorage.getItem('sessionToken');
    if (!token) {
      toast.error('Please log in first');
      return;
    }

    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Test notification sent! Check your device.');
      } else {
        toast.error(data.message || 'Failed to send test notification');
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    }
  };

  const StatusItem = ({ label, value, ok }: { label: string; value: any; ok: boolean }) => (
    <div className="flex items-center justify-between py-2">
      <span className="text-sm font-medium">{label}:</span>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">{String(value)}</span>
        {ok ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  );

  if (status.isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const allOk = status.permission === 'granted' && 
                status.serviceWorker && 
                status.subscription && 
                status.vapidConfigured;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Push Notification Status
        </CardTitle>
        <CardDescription>
          Debug information for push notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border p-4 space-y-2">
          <StatusItem 
            label="Browser Permission" 
            value={status.permission} 
            ok={status.permission === 'granted'} 
          />
          <StatusItem 
            label="Service Worker" 
            value={status.serviceWorker ? 'Registered' : 'Not registered'} 
            ok={status.serviceWorker} 
          />
          <StatusItem 
            label="Push Subscription" 
            value={status.subscription ? 'Active' : 'None'} 
            ok={status.subscription} 
          />
          <StatusItem 
            label="VAPID Keys" 
            value={status.vapidConfigured ? 'Configured' : 'Not configured'} 
            ok={status.vapidConfigured} 
          />
        </div>

        {!allOk && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Setup Required:</p>
                <ul className="list-disc list-inside space-y-1">
                  {status.permission !== 'granted' && (
                    <li>Grant notification permission</li>
                  )}
                  {!status.serviceWorker && (
                    <li>Service worker not registered (refresh the page)</li>
                  )}
                  {status.permission === 'granted' && !status.subscription && (
                    <li>Create push subscription</li>
                  )}
                  {!status.vapidConfigured && (
                    <li>VAPID keys not configured (check .env.local)</li>
                  )}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {status.permission !== 'granted' && (
            <Button onClick={requestPermission} size="sm">
              <Bell className="h-4 w-4 mr-2" />
              Enable Notifications
            </Button>
          )}
          
          {status.permission === 'granted' && !status.subscription && (
            <Button onClick={createSubscription} size="sm" variant="outline">
              Create Subscription
            </Button>
          )}

          <Button onClick={checkStatus} size="sm" variant="outline">
            Refresh Status
          </Button>

          {allOk && (
            <Button onClick={sendTestNotification} size="sm" variant="default">
              Send Test Notification
            </Button>
          )}
        </div>

        <div className="text-xs text-muted-foreground">
          <p>Run this in your browser console for more info:</p>
          <pre className="mt-1 p-2 bg-muted rounded text-xs">
{`navigator.serviceWorker.getRegistration().then(r => console.log('SW:', r))
navigator.serviceWorker.ready.then(r => r.pushManager.getSubscription()).then(s => console.log('Sub:', s))`}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

// Helper function to convert base64 to Uint8Array
function urlB64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}