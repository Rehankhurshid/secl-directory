'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, CheckCircle, XCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function AndroidTestPage() {
  const [status, setStatus] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState<string>('');

  useEffect(() => {
    checkEnvironment();
  }, []);

  const checkEnvironment = async () => {
    try {
      // Check debug info
      const debugResponse = await fetch('/api/notifications/debug');
      const debugInfo = await debugResponse.json();

      // Check service worker
      let swStatus = 'Not supported';
      let swRegistration = null;
      let pushSubscription = null;

      if ('serviceWorker' in navigator) {
        swStatus = 'Supported';
        try {
          swRegistration = await navigator.serviceWorker.getRegistration();
          if (swRegistration) {
            swStatus = 'Registered';
            pushSubscription = await swRegistration.pushManager.getSubscription();
          }
        } catch (e) {
          swStatus = 'Error: ' + e.message;
        }
      }

      // Check notification permission
      const notificationPermission = 'Notification' in window ? Notification.permission : 'not supported';

      // Check Push API
      const pushSupported = 'PushManager' in window;

      setStatus({
        ...debugInfo,
        client: {
          serviceWorker: swStatus,
          hasRegistration: !!swRegistration,
          hasPushSubscription: !!pushSubscription,
          notificationPermission,
          pushSupported,
          isSecureContext: window.isSecureContext,
          protocol: window.location.protocol
        }
      });
    } catch (error) {
      console.error('Error checking environment:', error);
      setStatus({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setTestResult('❌ Notifications not supported');
      return;
    }

    const permission = await Notification.requestPermission();
    setTestResult(`Permission: ${permission}`);
    checkEnvironment();
  };

  const registerServiceWorker = async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js');
      setTestResult('✅ Service Worker registered');
      checkEnvironment();
    } catch (error) {
      setTestResult(`❌ SW registration failed: ${error.message}`);
    }
  };

  const createPushSubscription = async () => {
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidKey) {
        setTestResult('❌ VAPID key not found');
        return;
      }

      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(vapidKey)
        });
        setTestResult('✅ Push subscription created locally');
      } else {
        setTestResult('✅ Push subscription already exists locally');
      }

      // Save to server if logged in
      const token = localStorage.getItem('sessionToken');
      if (token) {
        setTestResult(prev => prev + '\n📤 Saving subscription to server...');
        
        const response = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(subscription.toJSON())
        });

        if (response.ok) {
          const data = await response.json();
          setTestResult(prev => prev + '\n✅ Subscription saved to server! You can now receive push notifications.');
        } else {
          const error = await response.json();
          setTestResult(prev => prev + `\n❌ Failed to save to server: ${error.message || error.error}`);
        }
      } else {
        setTestResult(prev => prev + '\n⚠️ Not logged in - subscription only saved locally. Log in and click this button again to save to server.');
      }

      checkEnvironment();
    } catch (error) {
      setTestResult(`❌ Subscription failed: ${error.message}`);
    }
  };

  const testNotification = async () => {
    try {
      if (Notification.permission !== 'granted') {
        setTestResult('❌ Notification permission not granted');
        return;
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;
      
      // Use service worker to show notification (required on Android and secure contexts)
      await registration.showNotification('Test Notification 🎉', {
        body: 'If you see this, notifications are working! Time: ' + new Date().toLocaleTimeString(),
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        tag: 'test-' + Date.now(),
        vibrate: [200, 100, 200],
        requireInteraction: false,
        data: {
          url: '/messaging',
          timestamp: Date.now()
        }
      });
      
      setTestResult('✅ Service Worker notification sent successfully! Check your notification panel.');
    } catch (error) {
      setTestResult(`❌ Notification test failed: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 max-w-2xl flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isAndroid = status.environment?.platform === 'Android';

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Smartphone className="h-6 w-6" />
        Android Push Notification Test
      </h1>

      {!isAndroid && (
        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            This page is optimized for Android. Current platform: {status.environment?.platform}
          </AlertDescription>
        </Alert>
      )}

      <div className="space-y-6">
        {/* Environment Status */}
        <Card>
          <CardHeader>
            <CardTitle>Environment Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <StatusRow label="Platform" value={status.environment?.platform} ok={isAndroid} />
              <StatusRow label="Protocol" value={status.environment?.protocol} ok={status.environment?.isSecure} />
              <StatusRow label="Secure Context" value={status.client?.isSecureContext ? 'Yes' : 'No'} ok={status.client?.isSecureContext} />
              <StatusRow label="Service Worker" value={status.client?.serviceWorker} ok={status.client?.hasRegistration} />
              <StatusRow label="Push API" value={status.client?.pushSupported ? 'Supported' : 'Not supported'} ok={status.client?.pushSupported} />
              <StatusRow label="Notification Permission" value={status.client?.notificationPermission} ok={status.client?.notificationPermission === 'granted'} />
              <StatusRow label="Push Subscription" value={status.client?.hasPushSubscription ? 'Active' : 'None'} ok={status.client?.hasPushSubscription} />
              <StatusRow label="VAPID Keys" value={status.vapid?.publicKeySet ? 'Configured' : 'Missing'} ok={status.vapid?.publicKeySet} />
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Test Actions</CardTitle>
            <CardDescription>Step by step testing</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={requestPermission} variant="outline" size="sm">
                1. Request Permission
              </Button>
              <Button onClick={registerServiceWorker} variant="outline" size="sm">
                2. Register SW
              </Button>
              <Button onClick={createPushSubscription} variant="outline" size="sm">
                3. Create Subscription
              </Button>
              <Button onClick={testNotification} variant="outline" size="sm">
                4. Test Notification
              </Button>
            </div>
            
            {/* Add server push test button */}
            <Button 
              onClick={async () => {
                try {
                  const token = localStorage.getItem('sessionToken');
                  if (!token) {
                    setTestResult('❌ Not logged in. Please log in first.');
                    return;
                  }
                  
                  const response = await fetch('/api/notifications/test-direct', {
                    method: 'POST',
                    headers: {
                      'Authorization': `Bearer ${token}`
                    }
                  });
                  
                  const result = await response.json();
                  setTestResult(`Server Push Test:\n${JSON.stringify(result, null, 2)}`);
                } catch (error) {
                  setTestResult(`❌ Server push test failed: ${error.message}`);
                }
              }}
              className="w-full"
              variant="default"
            >
              5. Test Server Push (Requires Login)
            </Button>

            {testResult && (
              <div className="mt-4 p-3 bg-muted rounded-lg">
                <pre className="text-xs whitespace-pre-wrap">{testResult}</pre>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Android Specific Tips */}
        {isAndroid && (
          <Card>
            <CardHeader>
              <CardTitle>Android Troubleshooting</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="list-decimal list-inside space-y-2 text-sm">
                <li>Make sure you're using Chrome (not Samsung Internet or other browsers)</li>
                <li>Check Chrome version: Menu → Settings → About Chrome (needs v50+)</li>
                <li>Chrome Settings → Site Settings → Notifications → Allow</li>
                <li>Android Settings → Apps → Chrome → Notifications → Enable</li>
                <li>Disable battery optimization for Chrome if issues persist</li>
                <li>Try installing as PWA: Menu → Add to Home Screen</li>
                <li>If using localtunnel, ensure stable connection</li>
              </ol>
            </CardContent>
          </Card>
        )}

        {/* Debug Info */}
        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
              {JSON.stringify(status, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatusRow({ label, value, ok }: { label: string; value: any; ok: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="font-medium">{label}:</span>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground">{String(value)}</span>
        {ok ? (
          <CheckCircle className="h-4 w-4 text-green-500" />
        ) : (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
      </div>
    </div>
  );
}

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