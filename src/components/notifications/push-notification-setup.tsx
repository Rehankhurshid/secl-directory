'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Bell, BellOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PushNotificationSetup() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSettingUp, setIsSettingUp] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed
    const dismissed = localStorage.getItem('push-notification-dismissed');
    if (dismissed === 'true') {
      setIsDismissed(true);
    }

    // Check initial permission state
    if ('Notification' in window) {
      setPermission(Notification.permission);
      
      // If permission already granted, set up push subscription silently
      if (Notification.permission === 'granted') {
        setupPushSubscription();
      }
    }
  }, []);

  const setupPushSubscription = async () => {
    try {
      // Check if user is logged in
      const token = localStorage.getItem('sessionToken');
      if (!token) {
        console.log('User not logged in, skipping push setup');
        return;
      }

      // Check if service worker is ready
      const registration = await navigator.serviceWorker.ready;
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        // Get VAPID key
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
        if (!vapidKey) {
          console.error('VAPID key not configured');
          return;
        }

        // Create subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlB64ToUint8Array(vapidKey)
        });
        
        console.log('✅ Push subscription created');
      }

      // Save to server
      const response = await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscription.toJSON())
      });

      if (response.ok) {
        console.log('✅ Push subscription saved to server');
      } else {
        console.error('Failed to save push subscription to server');
      }
    } catch (error) {
      console.error('Error setting up push subscription:', error);
    }
  };

  const requestPermission = async () => {
    setIsSettingUp(true);
    
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notifications enabled! Setting up...');
        await setupPushSubscription();
        toast.success('You\'ll now receive notifications for new messages!');
      } else if (result === 'denied') {
        toast.error('Notifications blocked. Enable them in browser settings to receive message alerts.');
      }
    } catch (error) {
      toast.error('Failed to set up notifications');
      console.error('Notification setup error:', error);
    } finally {
      setIsSettingUp(false);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('push-notification-dismissed', 'true');
  };

  // Don't show anything if notifications not supported
  if (!('Notification' in window)) {
    return null;
  }

  // Don't show if already set up
  if (permission === 'granted') {
    return null;
  }

  // Don't show if user dismissed
  if (isDismissed || permission === 'denied') {
    return null;
  }

  // Show subtle prompt for notifications
  return (
    <div className="fixed bottom-20 right-4 z-50 animate-in slide-in-from-bottom-5">
      <div className="bg-background border rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-full">
            <Bell className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Enable Notifications</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Get notified when you receive new messages
            </p>
            <div className="flex gap-2 mt-3">
              <Button
                size="sm"
                onClick={requestPermission}
                disabled={isSettingUp}
              >
                {isSettingUp ? 'Setting up...' : 'Enable'}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDismiss}
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
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