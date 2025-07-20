'use client';

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { PushNotificationService } from '@/lib/services/push-notification.service';

interface NotificationContextType {
  permission: NotificationPermission | 'unsupported';
  isSupported: boolean;
  subscription: PushSubscription | null;
  requestPermission: () => Promise<NotificationPermission | 'unsupported'>;
  subscribeToPush: () => Promise<boolean>;
  unsubscribeFromPush: () => Promise<boolean>;
  showNotification: (title: string, options?: NotificationOptions) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
  vapidPublicKey?: string;
}

export function NotificationProvider({ children, vapidPublicKey }: NotificationProviderProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [isSupported, setIsSupported] = useState(true);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const pushService = PushNotificationService.getInstance();

  useEffect(() => {
    // Check if notifications are supported
    if (!('Notification' in window)) {
      setPermission('unsupported');
      setIsSupported(false);
      return;
    }

    // Set initial permission state
    setPermission(Notification.permission);

    // Initialize service worker and check subscription
    const initializeNotifications = async () => {
      const registration = await pushService.initialize();
      if (registration) {
        const existingSubscription = await pushService.getSubscription();
        setSubscription(existingSubscription);
      }
    };

    initializeNotifications();

    // Listen for permission changes
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then((permissionStatus) => {
          permissionStatus.addEventListener('change', () => {
            setPermission(Notification.permission);
          });
        })
        .catch(() => {
          // Permissions API might not support notifications
        });
    }
  }, [pushService]);

  const requestPermission = async (): Promise<NotificationPermission | 'unsupported'> => {
    if (!isSupported) {
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      // If permission granted, automatically subscribe to push
      if (result === 'granted' && vapidPublicKey) {
        await subscribeToPush();
      }
      
      return result;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return permission;
    }
  };

  const subscribeToPush = async (): Promise<boolean> => {
    if (permission !== 'granted' || !vapidPublicKey) {
      return false;
    }

    try {
      const newSubscription = await pushService.subscribeToPush(vapidPublicKey);
      if (newSubscription) {
        setSubscription(newSubscription);
        // Send subscription to server
        await pushService.sendSubscriptionToServer(newSubscription);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return false;
    }
  };

  const unsubscribeFromPush = async (): Promise<boolean> => {
    try {
      const success = await pushService.unsubscribeFromPush();
      if (success) {
        setSubscription(null);
        await pushService.removeSubscriptionFromServer();
      }
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    }
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission === 'granted') {
      new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        ...options,
      });
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        permission,
        isSupported,
        subscription,
        requestPermission,
        subscribeToPush,
        unsubscribeFromPush,
        showNotification,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}