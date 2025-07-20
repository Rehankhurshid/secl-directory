import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

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
      toast.success('Notifications enabled successfully!');
    } else if (result === 'denied') {
      toast.error('Notifications blocked. Please enable them in browser settings.');
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
      body: options?.body || 'This is a notification from your PWA!',
      icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODggNDg4Ij48cmVjdCB3aWR0aD0iNDg4IiBoZWlnaHQ9IjQ4OCIgZmlsbD0iIzE5NzZEMiIvPjx0ZXh0IHg9IjI0NCIgeT0iMjQ0IiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNzBweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tk9USUZZVEVNUE88L3RleHQ+PC9zdmc+',
      badge: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODggNDg4Ij48cmVjdCB3aWR0aD0iNDg4IiBoZWlnaHQ9IjQ4OCIgZmlsbD0iIzE5NzZEMiIvPjx0ZXh0IHg9IjI0NCIgeT0iMjQ0IiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNzBweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tk9USUZZVEVNUE88L3RleHQ+PC9zdmc+',
      tag: 'pwa-demo',
      requireInteraction: false,
      silent: false,
      data: { url: window.location.href }
    };

    try {
      // Try service worker first
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
