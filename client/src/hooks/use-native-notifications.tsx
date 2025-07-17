import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useEasterEggAnimations } from '@/components/animations/easter-egg-animations';

export interface MessageNotificationOptions {
  title: string;
  body: string;
  groupId?: number;
  senderId?: string;
  senderName?: string;
  tag?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  data?: any;
}

export function useNativeNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const { triggerAnimation } = useEasterEggAnimations();

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      toast({
        title: 'Notifications Not Supported',
        description: 'Your browser does not support notifications',
        variant: 'destructive'
      });
      return 'denied';
    }

    const result = await Notification.requestPermission();
    setPermission(result);
    
    if (result === 'granted') {
      toast({
        title: 'Notifications Enabled',
        description: 'You will now receive message notifications',
      });
      triggerAnimation('permission-granted');
    } else if (result === 'denied') {
      toast({
        title: 'Notifications Blocked',
        description: 'Please enable notifications in your browser settings',
        variant: 'destructive'
      });
    }
    
    return result;
  };

  const showNotification = async (options: MessageNotificationOptions): Promise<boolean> => {
    if (!isSupported) {
      return false;
    }

    if (permission !== 'granted') {
      return false;
    }

    const defaultOptions: NotificationOptions = {
      body: options.body,
      icon: '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: options.tag || 'employee-directory',
      requireInteraction: options.requireInteraction || false,
      silent: options.silent || false,
      data: {
        type: 'group_message',
        groupId: options.groupId,
        senderId: options.senderId,
        url: options.groupId ? `/groups?groupId=${options.groupId}` : '/',
        ...options.data
      },
      vibrate: [200, 100, 200],
      renotify: true
    };

    try {
      // Try service worker first for better Android support
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        if (registration.showNotification) {
          await registration.showNotification(options.title, defaultOptions);
          triggerAnimation('test-notification');
          return true;
        }
      }

      // Fallback to direct notification API
      const notification = new Notification(options.title, defaultOptions);

      notification.onclick = (event) => {
        event.preventDefault();
        
        // Trigger animation for notification click
        triggerAnimation('notification-clicked');
        
        // Focus window and navigate to group
        window.focus();
        if (options.groupId) {
          // Trigger custom navigation event
          const navigationEvent = new CustomEvent('notification-navigate', {
            detail: { groupId: options.groupId }
          });
          window.dispatchEvent(navigationEvent);
        }
        
        notification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => {
        notification.close();
      }, 5000);

      triggerAnimation('test-notification');
      return true;
    } catch (error) {
      console.error('Error creating notification:', error);
      return false;
    }
  };

  const showInAppToast = (options: MessageNotificationOptions) => {
    toast({
      title: options.title,
      description: options.body,
      duration: 3000,
    });
  };

  const handleNewMessage = async (messageData: any, currentEmployeeId?: string) => {
    // Don't show notifications for own messages (if currentEmployeeId is provided)
    if (currentEmployeeId && messageData.sender?.employeeId === currentEmployeeId) {
      return;
    }

    const notificationOptions: MessageNotificationOptions = {
      title: messageData.groupName || 'New Message',
      body: `${messageData.sender?.name || 'Someone'}: ${messageData.content}`,
      groupId: messageData.groupId,
      senderId: messageData.sender?.employeeId,
      senderName: messageData.sender?.name,
      tag: `group-message-${messageData.groupId}`,
      requireInteraction: false,
      silent: false,
      data: {
        timestamp: Date.now(),
        messageId: messageData.id
      }
    };

    // Always show in-app toast
    showInAppToast(notificationOptions);
    
    // Trigger new message animation
    triggerAnimation('new-message', `${messageData.sender?.name || 'Someone'} sent a message`);

    // Show browser notification if page is hidden or not focused
    if (document.hidden || !document.hasFocus()) {
      await showNotification(notificationOptions);
    }
  };

  return {
    isSupported,
    permission,
    requestPermission,
    showNotification,
    showInAppToast,
    handleNewMessage,
    triggerAnimation
  };
}