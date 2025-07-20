'use client';

import { useState, useEffect, useCallback } from 'react';

type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported';

interface UseNotificationPermissionOptions {
  onPermissionChange?: (permission: NotificationPermissionState) => void;
}

export function useNotificationPermission(options?: UseNotificationPermissionOptions) {
  const [permission, setPermission] = useState<NotificationPermissionState>('default');
  const [isSupported, setIsSupported] = useState(true);
  const [isRequesting, setIsRequesting] = useState(false);

  // Check support and initial permission
  useEffect(() => {
    if (!('Notification' in window)) {
      setPermission('unsupported');
      setIsSupported(false);
      return;
    }

    // Set initial permission
    const currentPermission = Notification.permission as NotificationPermissionState;
    setPermission(currentPermission);

    // Watch for permission changes
    if ('permissions' in navigator) {
      navigator.permissions.query({ name: 'notifications' as PermissionName })
        .then((permissionStatus) => {
          permissionStatus.addEventListener('change', () => {
            const newPermission = Notification.permission as NotificationPermissionState;
            setPermission(newPermission);
            options?.onPermissionChange?.(newPermission);
          });
        })
        .catch(() => {
          // Permissions API might not support notifications query
        });
    }
  }, [options]);

  const requestPermission = useCallback(async (): Promise<NotificationPermissionState> => {
    if (!isSupported) {
      return 'unsupported';
    }

    setIsRequesting(true);
    try {
      const result = await Notification.requestPermission();
      const newPermission = result as NotificationPermissionState;
      setPermission(newPermission);
      options?.onPermissionChange?.(newPermission);
      return newPermission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return permission;
    } finally {
      setIsRequesting(false);
    }
  }, [isSupported, permission, options]);

  const showNotification = useCallback(async (
    title: string,
    options?: NotificationOptions
  ): Promise<Notification | null> => {
    if (permission !== 'granted') {
      console.warn('Cannot show notification: permission not granted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        ...options,
      });

      return notification;
    } catch (error) {
      console.error('Error showing notification:', error);
      return null;
    }
  }, [permission]);

  return {
    permission,
    isSupported,
    isRequesting,
    requestPermission,
    showNotification,
  };
}