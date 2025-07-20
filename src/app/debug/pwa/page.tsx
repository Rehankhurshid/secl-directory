"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, XCircle, AlertCircle, Bell, Download, Smartphone, Loader2 } from 'lucide-react';

interface PWAStatus {
  serviceWorker: boolean;
  manifest: boolean;
  pushManager: boolean;
  notification: string;
  standalone: boolean;
  beforeInstallPrompt: boolean;
  https: boolean;
}

export default function PWADebugPage() {
  const [pwaStatus, setPwaStatus] = useState<PWAStatus>({
    serviceWorker: false,
    manifest: false,
    pushManager: false,
    notification: 'default',
    standalone: false,
    beforeInstallPrompt: false,
    https: false,
  });

  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [testMessage, setTestMessage] = useState('Test notification from PWA debug page');
  const [isLoading, setIsLoading] = useState(false);
  const [testingNotifications, setTestingNotifications] = useState(false);
  const [testingPushSelf, setTestingPushSelf] = useState(false);
  const [testingBellNotification, setTestingBellNotification] = useState(false);

  useEffect(() => {
    checkPWAStatus();
  }, []);

  const checkPWAStatus = async () => {
    const status: PWAStatus = {
      serviceWorker: 'serviceWorker' in navigator,
      manifest: false,
      pushManager: 'PushManager' in window,
      notification: Notification.permission,
      standalone: window.matchMedia('(display-mode: standalone)').matches || 
                  (window.navigator as any).standalone === true,
      beforeInstallPrompt: false,
      https: window.location.protocol === 'https:' || window.location.hostname === 'localhost',
    };

    // Check manifest
    try {
      const response = await fetch('/manifest.json');
      status.manifest = response.ok;
    } catch {
      status.manifest = false;
    }

    // Check service worker
    if (status.serviceWorker) {
      try {
        const registration = await navigator.serviceWorker.ready;
        if (registration.pushManager) {
          const sub = await registration.pushManager.getSubscription();
          setSubscription(sub);
        }
      } catch (error) {
        console.error('Service worker check failed:', error);
      }
    }

    // Listen for beforeinstallprompt
    window.addEventListener('beforeinstallprompt', () => {
      status.beforeInstallPrompt = true;
      setPwaStatus(prev => ({ ...prev, beforeInstallPrompt: true }));
    });

    setPwaStatus(status);
  };

  const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support notifications');
      return;
    }

    const permission = await Notification.requestPermission();
    setPwaStatus(prev => ({ ...prev, notification: permission }));
    
    if (permission === 'granted') {
      subscribeToPush();
    }
  };

  const subscribeToPush = async () => {
    if (!pwaStatus.serviceWorker || !pwaStatus.pushManager) {
      alert('Push notifications not supported');
      return;
    }

    setIsLoading(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      
      if (!vapidPublicKey) {
        alert('VAPID public key not configured');
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
      });

      setSubscription(subscription);

      // Send to server
      const token = localStorage.getItem('sessionToken');
      if (token) {
        const response = await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(subscription),
        });

        if (response.ok) {
          alert('✅ Push subscription saved successfully!');
        } else {
          const error = await response.json();
          alert(`❌ Failed to save subscription: ${error.error}`);
        }
      } else {
        alert('⚠️ No session token found. Please login first.');
      }
    } catch (error) {
      console.error('Push subscription failed:', error);
      alert(`❌ Push subscription failed: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const sendTestNotification = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        alert('Please login first');
        return;
      }

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ message: testMessage }),
      });

      if (response.ok) {
        alert('✅ Test notification sent!');
      } else {
        const error = await response.json();
        alert(`❌ Failed to send notification: ${error.error}`);
      }
    } catch (error) {
      alert(`❌ Error: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerInstallPrompt = async () => {
    // This will be handled by the install banner component
    alert('Install prompt should appear automatically after 30 seconds or you can look for the install banner.');
  };

  const testPushNotification = async () => {
    setTestingNotifications(true);
    try {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        alert('❌ Not authenticated. Please login first.');
        return;
      }

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: 'Test PWA Notification',
          message: 'This is a test push notification from your PWA app!',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png'
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('✅ Test notification sent successfully! Check your device for the notification.');
      } else {
        alert(`❌ Failed to send test notification: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error testing push notification:', error);
      alert('❌ Failed to test push notification. Check console for details.');
    } finally {
      setTestingNotifications(false);
    }
  };

  const testSelfPushNotification = async () => {
    setTestingPushSelf(true);
    try {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        alert('❌ Not authenticated. Please login first.');
        return;
      }

      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: '🔔 Self Test Notification',
          message: 'You clicked the bell! Push notifications are working perfectly.',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          selfTest: true
        })
      });

      const result = await response.json();
      if (result.success) {
        // Also show browser notification for immediate feedback
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification('🔔 Self Test Notification', {
            body: 'You clicked the bell! Push notifications are working perfectly.',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png'
          });
        }
        alert('✅ Self test notification sent! You should see it now.');
      } else {
        alert(`❌ Failed to send self test notification: ${result.error}`);
      }
    } catch (error) {
      console.error('❌ Error testing self push notification:', error);
      alert('❌ Failed to test self push notification. Check console for details.');
    } finally {
      setTestingPushSelf(false);
    }
  };

  const testBellNotification = async () => {
    if (testingBellNotification) return;
    
    setTestingBellNotification(true);
    try {
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        alert('Please login first');
        return;
      }

      console.log('🔔 Testing bell notification...');
      
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ Bell notification sent successfully:', result);
        alert(`🔔 Notification sent! Check your device for the notification.`);
      } else {
        console.error('❌ Bell notification failed:', result);
        alert(`❌ Failed: ${result.message || result.error}`);
      }
    } catch (error) {
      console.error('❌ Bell notification error:', error);
      alert('❌ Error sending notification');
    } finally {
      setTestingBellNotification(false);
    }
  };

  function urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  const StatusIcon = ({ status }: { status: boolean }) => 
    status ? <CheckCircle className="h-4 w-4 text-green-500" /> : <XCircle className="h-4 w-4 text-red-500" />;

  return (
    <div className="container max-w-4xl mx-auto p-6 space-y-8">
      {/* Header with Bell Icon */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">PWA Debug Console</h1>
          <p className="text-muted-foreground">Test and debug Progressive Web App features</p>
        </div>
        <Button
          onClick={testBellNotification}
          disabled={testingBellNotification || pwaStatus.notification !== 'granted'}
          size="lg"
          className="gap-2"
        >
          {testingBellNotification ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {testingBellNotification ? 'Sending...' : 'Test Bell'}
        </Button>
      </div>

      {/* PWA Requirements Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            PWA Requirements Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(pwaStatus).map(([key, value]) => (
              <div key={key} className="flex items-center gap-2 p-3 rounded-lg border">
                {value ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-500" />
                )}
                <span className="font-medium capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Installation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            App Installation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pwaStatus.standalone ? (
            <div className="text-center text-green-600 font-medium">
              ✅ App is already installed and running in standalone mode!
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Click the button below to test the installation flow. The install prompt should appear automatically.
              </p>
              <Button onClick={triggerInstallPrompt} className="w-full">
                Test Install Prompt
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Push Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {pwaStatus.notification === 'denied' && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium">Notifications Blocked</span>
              </div>
              <p className="text-sm text-red-700 mt-1">
                Please enable notifications in your browser settings and refresh the page.
              </p>
            </div>
          )}

          {pwaStatus.notification === 'default' && (
            <Button onClick={requestNotificationPermission} className="w-full">
              Request Notification Permission
            </Button>
          )}

          {pwaStatus.notification === 'granted' && (
            <div className="space-y-4">
              {subscription ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <div className="text-green-800 font-medium">✅ Subscribed to Push Notifications</div>
                  <p className="text-sm text-green-700 mt-1">
                    Endpoint: {subscription.endpoint.substring(0, 50)}...
                  </p>
                </div>
              ) : (
                <Button onClick={subscribeToPush} disabled={isLoading} className="w-full">
                  {isLoading ? 'Subscribing...' : 'Subscribe to Push Notifications'}
                </Button>
              )}

              <div className="space-y-2">
                <Label htmlFor="test-message">Test Message</Label>
                <Textarea
                  id="test-message"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Enter test notification message"
                />
                <Button 
                  onClick={sendTestNotification} 
                  disabled={isLoading || !subscription}
                  className="w-full"
                >
                  {isLoading ? 'Sending...' : 'Send Test Notification'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Developer Information */}
      <Card>
        <CardHeader>
          <CardTitle>Developer Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <strong>User Agent:</strong>
              <p className="text-muted-foreground break-all">
                {typeof window !== 'undefined' ? window.navigator.userAgent : 'Loading...'}
              </p>
            </div>
            <div>
              <strong>Protocol:</strong>
              <p className="text-muted-foreground">
                {typeof window !== 'undefined' ? window.location.protocol : 'Loading...'}
              </p>
            </div>
            <div>
              <strong>Service Worker Support:</strong>
              <p className="text-muted-foreground">
                {'serviceWorker' in navigator ? '✅ Supported' : '❌ Not Supported'}
              </p>
            </div>
            <div>
              <strong>Push Manager Support:</strong>
              <p className="text-muted-foreground">
                {'PushManager' in window ? '✅ Supported' : '❌ Not Supported'}
              </p>
            </div>
          </div>
          
          {subscription && (
            <div className="mt-4 p-3 rounded border bg-muted/30">
              <strong>Current Push Subscription:</strong>
              <pre className="text-xs mt-2 overflow-x-auto">
                {JSON.stringify({
                  endpoint: subscription.endpoint.substring(0, 50) + '...',
                  keys: {
                    p256dh: '***hidden***',
                    auth: '***hidden***'
                  }
                }, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 