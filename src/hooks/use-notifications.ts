import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      toast.error('Notifications are not supported in this browser');
      return 'denied';
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      toast.success('✅ Notifications enabled successfully!');
    } else if (result === 'denied') {
      toast.error('❌ Notifications blocked. Please enable them in browser settings.');
    }
    
    return result;
  };

  const showNotification = async (title: string, options?: NotificationOptions): Promise<boolean> => {
    if (!isSupported) {
      toast.error('Notifications are not supported');
      return false;
    }

    if (permission !== 'granted') {
      toast.warning('Please enable notifications first');
      return false;
    }

    const defaultOptions: NotificationOptions = {
      body: options?.body || 'New message from SECL Messaging',
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: 'secl-messaging',
      requireInteraction: false,
      silent: false,
      data: { url: window.location.href, timestamp: Date.now() }
    };

    try {
      // Try service worker first (critical for Android)
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.showNotification) {
          await registration.showNotification(title, { ...defaultOptions, ...options });
          return true;
        }
      }

      // Fallback to direct notification API
      const notification = new Notification(title, { ...defaultOptions, ...options });

      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  };

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification
  };
} 