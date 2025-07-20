'use client';

import { useState, useEffect } from 'react';
import { Bell, BellOff, Loader2, Smartphone, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { PushNotificationService } from '@/lib/push-notifications';
import { Badge } from '@/components/ui/badge';

interface PushNotificationOptInProps {
  token: string;
}

export function PushNotificationOptIn({ token }: PushNotificationOptInProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
  const { toast } = useToast();

  const pushService = PushNotificationService.getInstance();

  useEffect(() => {
    checkSupport();
    detectPlatform();
  }, []);

  const checkSupport = async () => {
    // Check if push notifications are supported
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);

    if (supported) {
      // Check current permission status
      setPermission(Notification.permission);

      // Check if already subscribed
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        setIsSubscribed(!!subscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      }
    }
  };

  const detectPlatform = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    
    if (isIOS) {
      setPlatform('ios');
    } else if (isAndroid) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }
  };

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      // First check if notifications are already denied
      if (Notification.permission === 'denied') {
        setPermission('denied');
        toast({
          title: 'Notifications blocked',
          description: 'Please enable notifications in your browser settings and refresh the page',
          variant: 'destructive',
        });
        return;
      }

      // Request permission first if not granted
      if (Notification.permission !== 'granted') {
        console.log('Requesting notification permission...');
        const perm = await Notification.requestPermission();
        console.log('Permission result:', perm);
        setPermission(perm);
        
        if (perm !== 'granted') {
          toast({
            title: 'Permission not granted',
            description: perm === 'denied' 
              ? 'Notifications were blocked. Enable them in browser settings.' 
              : 'Notification permission was not granted.',
            variant: 'destructive',
          });
          return;
        }
      }

      // Initialize push service
      console.log('Initializing push service...');
      const initialized = await pushService.initialize();
      if (!initialized) {
        throw new Error('Failed to initialize push service');
      }

      // Subscribe to push notifications
      console.log('Subscribing to push notifications...');
      const subscription = await pushService.subscribe(token);
      if (subscription) {
        setIsSubscribed(true);
        toast({
          title: '✅ Push notifications enabled',
          description: 'You will now receive notifications from SECL Directory',
        });
        
        // Test notification after successful subscription
        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          await registration.showNotification('Welcome!', {
            body: 'Push notifications are now enabled for SECL Directory',
            icon: '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'welcome-notification',
          });
        }
      } else {
        throw new Error('Failed to create push subscription');
      }
    } catch (error) {
      console.error('Subscription error:', error);
      toast({
        title: 'Subscription failed',
        description: error.message || 'Failed to enable push notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setIsLoading(true);
    try {
      const success = await pushService.unsubscribe(token);
      if (success) {
        setIsSubscribed(false);
        toast({
          title: 'Push notifications disabled',
          description: 'You will no longer receive notifications',
        });
      }
    } catch (error) {
      console.error('Unsubscribe error:', error);
      toast({
        title: 'Unsubscribe failed',
        description: 'Failed to disable push notifications. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Push notifications are not supported in this browser. 
          Please use a modern browser like Chrome, Firefox, or Safari.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          {platform !== 'unknown' && (
            <Badge variant="secondary">
              <Smartphone className="h-3 w-3 mr-1" />
              {platform.toUpperCase()}
            </Badge>
          )}
        </div>
        <CardDescription>
          Get instant notifications for messages and important updates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Platform-specific instructions */}
        {platform === 'ios' && !isSubscribed && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>iOS Users:</strong> To enable notifications:
              <ol className="mt-2 ml-4 list-decimal text-sm">
                <li>Add this app to your home screen first</li>
                <li>Open the app from your home screen</li>
                <li>Then enable notifications</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}

        {/* Current status */}
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">Status:</span>
          <span className="text-sm">
            {isSubscribed ? (
              <span className="text-green-600 dark:text-green-400">Enabled</span>
            ) : permission === 'denied' ? (
              <span className="text-red-600 dark:text-red-400">Blocked</span>
            ) : (
              <span className="text-yellow-600 dark:text-yellow-400">Not enabled</span>
            )}
          </span>
        </div>

        {/* Action button */}
        {isSubscribed ? (
          <Button
            onClick={handleUnsubscribe}
            disabled={isLoading}
            variant="outline"
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <BellOff className="mr-2 h-4 w-4" />
            )}
            Disable Notifications
          </Button>
        ) : (
          <Button
            onClick={handleSubscribe}
            disabled={isLoading || permission === 'denied'}
            className="w-full"
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bell className="mr-2 h-4 w-4" />
            )}
            Enable Notifications
          </Button>
        )}

        {permission === 'denied' && (
          <Alert variant="destructive">
            <AlertDescription>
              Notifications are blocked. To enable:
              <ol className="mt-2 ml-4 list-decimal text-sm">
                <li>Click the lock icon in your browser's address bar</li>
                <li>Find "Notifications" in the permissions</li>
                <li>Change from "Block" to "Allow"</li>
                <li>Refresh this page</li>
              </ol>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}