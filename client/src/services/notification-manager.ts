import { toast } from '@/hooks/use-toast';

interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
  vibrate?: number[];
  renotify?: boolean;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private fcmToken: string | null = null;

  private constructor() {}

  static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  /**
   * Initialize notification permissions and FCM token
   */
  async initialize(employeeId: string, sessionToken: string): Promise<void> {
    try {
      // Request notification permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('Notification permission denied');
        return;
      }

      // Initialize FCM token if available
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.ready;
        // Token is managed by firebase-config.ts
      }
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      return await Notification.requestPermission();
    }

    return 'denied';
  }

  /**
   * Show a notification (works both in foreground and background)
   */
  async showNotification(options: NotificationOptions): Promise<void> {
    // Check if we should show notifications
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return;
    }

    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.ready;
        
        // Use service worker to show notification for better Android support
        await registration.showNotification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192x192.png',
          badge: options.badge || '/icon-192x192.png',
          tag: options.tag,
          data: options.data,
          requireInteraction: options.requireInteraction || false,
          actions: options.actions || [],
          vibrate: options.vibrate || [200, 100, 200],
          renotify: options.renotify !== false
        });
      } else {
        // Fallback to native notification API
        new Notification(options.title, {
          body: options.body,
          icon: options.icon || '/icon-192x192.png',
          badge: options.badge || '/icon-192x192.png',
          tag: options.tag,
          data: options.data,
          requireInteraction: options.requireInteraction || false
        });
      }
    } catch (error) {
      console.error('Error showing notification:', error);
    }
  }

  /**
   * Show an in-app toast notification
   */
  showToast(title: string, description: string): void {
    toast({
      title,
      description,
      duration: 3000
    });
  }

  /**
   * Handle incoming messages and show appropriate notifications
   */
  async handleMessage(message: any, currentEmployeeId: string): Promise<void> {
    // Don't show notifications for own messages
    if (message.sender?.employeeId === currentEmployeeId) {
      return;
    }

    const title = message.groupName || 'New Message';
    const body = `${message.sender?.name || 'Someone'}: ${message.content}`;

    // Always show in-app toast
    this.showToast(title, body);

    // Show browser notification if page is hidden
    if (document.hidden) {
      await this.showNotification({
        title,
        body,
        tag: `group-message-${message.groupId}`,
        data: {
          type: 'group_message',
          groupId: message.groupId,
          url: `/groups?groupId=${message.groupId}`
        },
        actions: [
          {
            action: 'view',
            title: 'View',
            icon: '/icon-192x192.png'
          }
        ]
      });
    }
  }

  /**
   * Clear notification badges when app becomes visible
   */
  clearBadges(): void {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'clear_badge'
      });
    }
  }

  /**
   * Handle notification clicks from service worker
   */
  setupNavigationHandler(): void {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data?.type === 'navigate' && event.data?.url) {
          // Use wouter navigation if available
          const routerEvent = new CustomEvent('notification-navigate', {
            detail: { url: event.data.url }
          });
          window.dispatchEvent(routerEvent);
        }
      });
    }
  }
}