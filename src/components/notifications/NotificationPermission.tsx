'use client';

import React, { useState, useEffect } from 'react';
import { Bell, BellOff, Check, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

interface NotificationPermissionProps {
  onPermissionChange?: (permission: NotificationPermissionState) => void;
  serviceWorkerRegistration?: ServiceWorkerRegistration;
}

export function NotificationPermission({ 
  onPermissionChange,
  serviceWorkerRegistration 
}: NotificationPermissionProps) {
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [isRequesting, setIsRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if notifications are supported and get current permission
  useEffect(() => {
    const checkNotificationSupport = () => {
      if (!('Notification' in window)) {
        setPermission('unsupported');
        return;
      }

      // Set initial permission state
      const currentPermission = Notification.permission as NotificationPermissionState;
      setPermission(currentPermission === 'default' || currentPermission === 'granted' || currentPermission === 'denied' 
        ? currentPermission 
        : 'default'
      );
    };

    checkNotificationSupport();

    // Listen for permission changes (some browsers support this)
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then((permissionStatus) => {
          permissionStatus.addEventListener('change', () => {
            const newPermission = Notification.permission as NotificationPermissionState;
            setPermission(newPermission);
            onPermissionChange?.(newPermission);
          });
        })
        .catch(() => {
          // Permissions API might not be available for notifications
        });
    }
  }, [onPermissionChange]);

  const requestNotificationPermission = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      // Check if we have a service worker registration
      if (!serviceWorkerRegistration && 'serviceWorker' in navigator) {
        // Try to get the active service worker registration
        const registrations = await navigator.serviceWorker.getRegistrations();
        if (registrations.length === 0) {
          setError('Service worker not registered. Please refresh the page and try again.');
          setIsRequesting(false);
          return;
        }
      }

      const result = await Notification.requestPermission();
      const newPermission = result as NotificationPermissionState;
      setPermission(newPermission);
      onPermissionChange?.(newPermission);

      // Show a test notification if permission was granted
      if (newPermission === 'granted') {
        showTestNotification();
      }
    } catch (err) {
      setError('Failed to request notification permission. Please try again.');
      console.error('Error requesting notification permission:', err);
    } finally {
      setIsRequesting(false);
    }
  };

  const showTestNotification = () => {
    if (permission === 'granted') {
      const notification = new Notification('Notifications Enabled!', {
        body: 'You\'ll now receive notifications for new messages.',
        icon: '/icon-192x192.png', // Make sure to add your PWA icon
        badge: '/icon-72x72.png',
        tag: 'notification-permission-granted',
        requireInteraction: false,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);
    }
  };

  const getPermissionBadge = () => {
    switch (permission) {
      case 'granted':
        return (
          <Badge variant="default" className="bg-green-500">
            <Check className="w-3 h-3 mr-1" />
            Enabled
          </Badge>
        );
      case 'denied':
        return (
          <Badge variant="destructive">
            <X className="w-3 h-3 mr-1" />
            Blocked
          </Badge>
        );
      case 'unsupported':
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Not Supported
          </Badge>
        );
      default:
        return (
          <Badge variant="outline">
            <Bell className="w-3 h-3 mr-1" />
            Not Set
          </Badge>
        );
    }
  };

  const getCardContent = () => {
    switch (permission) {
      case 'granted':
        return (
          <>
            <Alert className="border-green-200 bg-green-50">
              <Check className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Push notifications are enabled! You'll receive instant alerts for new messages.
              </AlertDescription>
            </Alert>
            <Button 
              onClick={showTestNotification}
              variant="outline"
              className="w-full"
            >
              <Bell className="w-4 h-4 mr-2" />
              Send Test Notification
            </Button>
          </>
        );

      case 'denied':
        return (
          <>
            <Alert className="border-red-200 bg-red-50">
              <X className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                Notifications are blocked. To enable them:
                <ol className="mt-2 ml-4 list-decimal text-sm">
                  <li>Click the lock icon in your browser's address bar</li>
                  <li>Find "Notifications" in the permissions</li>
                  <li>Change it from "Block" to "Allow"</li>
                  <li>Refresh this page</li>
                </ol>
              </AlertDescription>
            </Alert>
          </>
        );

      case 'unsupported':
        return (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Your browser doesn't support push notifications. Please use a modern browser like Chrome, Firefox, or Edge for the best experience.
            </AlertDescription>
          </Alert>
        );

      default:
        return (
          <>
            <div className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Why enable notifications?</h4>
                <ul className="space-y-1 text-sm text-blue-800">
                  <li>• Get instant alerts for new messages</li>
                  <li>• Never miss important conversations</li>
                  <li>• Stay connected even when the app is closed</li>
                  <li>• Easily manage notifications in your device settings</li>
                </ul>
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                onClick={requestNotificationPermission}
                disabled={isRequesting}
                className="w-full"
                size="lg"
              >
                <Bell className="w-4 h-4 mr-2" />
                {isRequesting ? 'Requesting Permission...' : 'Enable Push Notifications'}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                You can change this setting anytime in your browser permissions
              </p>
            </div>
          </>
        );
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            {permission === 'denied' ? (
              <BellOff className="w-5 h-5" />
            ) : (
              <Bell className="w-5 h-5" />
            )}
            Push Notifications
          </CardTitle>
          {getPermissionBadge()}
        </div>
        <CardDescription>
          Stay updated with real-time message notifications
        </CardDescription>
      </CardHeader>
      <CardContent>
        {getCardContent()}
      </CardContent>
    </Card>
  );
}