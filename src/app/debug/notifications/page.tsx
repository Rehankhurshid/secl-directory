'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function NotificationDebugPage() {
  const [checks, setChecks] = useState({
    browser: { status: 'checking', message: '' },
    permission: { status: 'checking', message: '' },
    serviceWorker: { status: 'checking', message: '' },
    pushManager: { status: 'checking', message: '' },
    subscription: { status: 'checking', message: '' },
    vapidKey: { status: 'checking', message: '' },
  });

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    const newChecks = { ...checks };

    // Check browser support
    if ('Notification' in window) {
      newChecks.browser = { status: 'success', message: 'Notifications API supported' };
    } else {
      newChecks.browser = { status: 'error', message: 'Notifications API not supported' };
    }

    // Check permission
    if ('Notification' in window) {
      const permission = Notification.permission;
      if (permission === 'granted') {
        newChecks.permission = { status: 'success', message: 'Permission granted' };
      } else if (permission === 'denied') {
        newChecks.permission = { status: 'error', message: 'Permission denied - check browser settings' };
      } else {
        newChecks.permission = { status: 'warning', message: 'Permission not yet requested' };
      }
    }

    // Check service worker
    if ('serviceWorker' in navigator) {
      try {
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length > 0) {
          const reg = registrations[0];
          newChecks.serviceWorker = { 
            status: 'success', 
            message: `Service worker registered (scope: ${reg.scope})` 
          };

          // Check if page is controlled
          if (navigator.serviceWorker.controller) {
            newChecks.serviceWorker.message += ' - Page is controlled';
          } else {
            newChecks.serviceWorker.message += ' - Page NOT controlled (try refreshing)';
            newChecks.serviceWorker.status = 'warning';
          }
        } else {
          newChecks.serviceWorker = { status: 'error', message: 'No service worker registered' };
        }
      } catch (error) {
        newChecks.serviceWorker = { status: 'error', message: `Service worker error: ${error.message}` };
      }
    } else {
      newChecks.serviceWorker = { status: 'error', message: 'Service workers not supported' };
    }

    // Check Push Manager
    if ('PushManager' in window) {
      newChecks.pushManager = { status: 'success', message: 'Push API supported' };
    } else {
      newChecks.pushManager = { status: 'error', message: 'Push API not supported' };
    }

    // Check existing subscription
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          newChecks.subscription = { 
            status: 'success', 
            message: 'Push subscription active' 
          };
        } else {
          newChecks.subscription = { 
            status: 'warning', 
            message: 'No push subscription found' 
          };
        }
      } catch (error) {
        newChecks.subscription = { 
          status: 'error', 
          message: `Subscription check failed: ${error.message}` 
        };
      }
    }

    // Check VAPID key
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (vapidKey) {
      newChecks.vapidKey = { 
        status: 'success', 
        message: `VAPID key configured (${vapidKey.substring(0, 20)}...)` 
      };
    } else {
      newChecks.vapidKey = { 
        status: 'error', 
        message: 'VAPID key not found in environment variables' 
      };
    }

    setChecks(newChecks);
  };

  const requestPermission = async () => {
    try {
      const permission = await Notification.requestPermission();
      console.log('Permission result:', permission);
      runDiagnostics();
    } catch (error) {
      console.error('Permission request failed:', error);
      alert(`Failed to request permission: ${error.message}`);
    }
  };

  const testNotification = async () => {
    try {
      if (Notification.permission !== 'granted') {
        alert('Please grant notification permission first');
        return;
      }

      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification('Test Notification', {
          body: 'If you see this, notifications are working!',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: 'test',
          renotify: true,
        });
      } else {
        new Notification('Test Notification', {
          body: 'If you see this, basic notifications are working!',
          icon: '/icon-192x192.png',
        });
      }
    } catch (error) {
      console.error('Test notification failed:', error);
      alert(`Failed to show notification: ${error.message}`);
    }
  };

  const createPushSubscription = async () => {
    try {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
        alert('Push notifications are not supported');
        return;
      }

      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidKey) {
        alert('VAPID key not configured. Run: npm run generate:vapid');
        return;
      }

      // Convert VAPID key
      const convertedKey = urlBase64ToUint8Array(vapidKey);
      
      // Create subscription
      console.log('Creating push subscription...');
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
      
      console.log('Push subscription created:', subscription);
      
      // Save to server (if you have auth token)
      const token = localStorage.getItem('sessionToken');
      if (token) {
        const response = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ subscription: subscription.toJSON() })
        });
        
        if (response.ok) {
          alert('Push subscription created and saved successfully!');
        } else {
          const errorData = await response.json();
          alert(`Push subscription created but failed to save to server:\n${errorData.error}\n${errorData.details || ''}`);
          console.error('Server error:', errorData);
        }
      } else {
        alert('Push subscription created locally (no auth token to save to server)');
      }
      
      runDiagnostics();
    } catch (error) {
      console.error('Failed to create push subscription:', error);
      alert(`Failed to create subscription: ${error.message}`);
    }
  };

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
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
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      default:
        return <Loader2 className="h-5 w-5 animate-spin" />;
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <Card>
        <CardHeader>
          <CardTitle>Push Notification Diagnostics</CardTitle>
          <CardDescription>
            Debug tool to check if push notifications are properly configured
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Diagnostic Results */}
          <div className="space-y-2">
            {Object.entries(checks).map(([key, check]) => (
              <div key={key} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                {getStatusIcon(check.status)}
                <div className="flex-1">
                  <p className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
                  <p className="text-sm text-muted-foreground">{check.message}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 pt-4">
            <Button onClick={requestPermission} variant="outline">
              Request Permission
            </Button>
            <Button onClick={createPushSubscription} variant="outline">
              Create Push Subscription
            </Button>
            <Button onClick={testNotification}>
              Test Notification
            </Button>
            <Button onClick={runDiagnostics} variant="secondary">
              Re-run Diagnostics
            </Button>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Troubleshooting Steps:</strong>
              <ol className="mt-2 ml-4 list-decimal text-sm space-y-1">
                <li>All checks should show green (success) for notifications to work</li>
                <li>If permission is denied, reset it in browser settings</li>
                <li>If service worker is not controlled, try refreshing the page</li>
                <li>If VAPID key is missing, run: <code className="bg-muted px-1">npm run generate:vapid</code></li>
                <li>Check browser console for detailed error messages</li>
              </ol>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}