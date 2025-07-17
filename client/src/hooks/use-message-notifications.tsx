import { useEffect, useCallback } from 'react';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Bell } from 'lucide-react';

interface MessageNotificationOptions {
  senderName: string;
  message: string;
  groupName: string;
  groupId: number;
}

export function useMessageNotifications() {
  const { employee } = useAuth();

  const showInAppNotification = useCallback((options: MessageNotificationOptions) => {
    // Show toast notification for in-app messages
    toast({
      title: options.groupName,
      description: `${options.senderName}: ${options.message}`,
      action: (
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4" />
          <span className="text-xs">New message</span>
        </div>
      ),
    });
  }, []);

  const showBrowserNotification = useCallback(async (options: MessageNotificationOptions) => {
    // Check if notifications are supported and permitted
    if (!('Notification' in window)) {
      return;
    }

    if (Notification.permission !== 'granted') {
      return;
    }

    try {
      // Use service worker to show notification for better Android support
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        await registration.showNotification(options.groupName, {
          body: `${options.senderName}: ${options.message}`,
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          tag: `group-message-${options.groupId}`,
          data: {
            type: 'group_message',
            groupId: options.groupId,
            url: `/groups?groupId=${options.groupId}`
          },
          requireInteraction: false,
          vibrate: [200, 100, 200],
          renotify: true
        });
      }
    } catch (error) {
      console.error('Error showing browser notification:', error);
    }
  }, []);

  const handleNewMessage = useCallback(async (messageData: any) => {
    // Don't show notifications for own messages
    if (messageData.sender?.employeeId === employee?.employeeId) {
      return;
    }

    const notificationOptions: MessageNotificationOptions = {
      senderName: messageData.sender?.name || 'Unknown',
      message: messageData.content,
      groupName: messageData.groupName || 'Group Message',
      groupId: messageData.groupId
    };

    // Always show in-app notification
    showInAppNotification(notificationOptions);

    // Show browser notification if page is not visible
    if (document.hidden) {
      await showBrowserNotification(notificationOptions);
    }
  }, [employee?.employeeId, showInAppNotification, showBrowserNotification]);

  // Listen for visibility changes to handle notifications properly
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        // Clear any notification badges when app becomes visible
        if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
          navigator.serviceWorker.controller.postMessage({
            type: 'clear_badge'
          });
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Listen for service worker messages (navigation requests from notifications)
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'navigate' && event.data?.url) {
          // Navigate to the requested URL
          window.location.href = event.data.url;
        }
      });
    }
  }, []);

  return {
    handleNewMessage,
    showInAppNotification,
    showBrowserNotification
  };
}