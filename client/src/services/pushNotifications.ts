import { apiRequest } from "@/lib/queryClient";
import { messaging, getToken, onMessage } from '../firebase-config';

export interface PushSubscriptionResponse {
  success: boolean;
  token?: string;
}

export class PushNotificationService {
  private fcmToken: string | null = null;

  async initialize(): Promise<boolean> {
    try {
      // Check if push notifications are supported
      if (!('serviceWorker' in navigator) || !messaging) {
        console.log('Push notifications not supported');
        return false;
      }

      // Register Firebase messaging service worker
      await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/firebase-cloud-messaging-push-scope',
      });

      // Set up foreground message handler
      onMessage(messaging, (payload) => {
        console.log('Foreground message received:', payload);
        
        // Show notification if app is in focus
        if (payload.notification) {
          new Notification(payload.notification.title || 'Employee Directory', {
            body: payload.notification.body,
            icon: payload.notification.icon || '/icon-192x192.png',
            badge: '/icon-192x192.png',
            tag: 'employee-directory',
            data: payload.data || {},
            requireInteraction: true,
            vibrate: [200, 100, 200]
          });
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to initialize push notifications:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        console.log('Notification permission:', permission);
        
        // For Android, also check if notifications are blocked at system level
        if (permission === 'denied') {
          console.warn('Notifications are denied. User may need to enable them in system settings.');
        }
        
        return permission === 'granted';
      }
      return false;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return false;
    }
  }

  async subscribe(): Promise<boolean> {
    try {
      // Get FCM token
      const token = await getToken(messaging, {
        vapidKey: 'BLDTndpgs69Erh1Rw-s-86I_mU18VcgTRdK7KIROVfjg4kId7Gvve_Hs-wPE0EKnrnlvWEuYvMI8VUZuYrbje1M',
      });

      if (!token) {
        console.error('Failed to get FCM token');
        return false;
      }

      this.fcmToken = token;
      console.log('FCM token obtained:', token);

      // Send token to server
      const response = await apiRequest<PushSubscriptionResponse>('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: token,
          type: 'fcm',
        }),
      });

      console.log('FCM token subscription successful:', response.success);
      return response.success;
    } catch (error) {
      console.error('Failed to subscribe to FCM:', error);
      return false;
    }
  }

  async unsubscribe(): Promise<boolean> {
    try {
      if (!this.fcmToken) {
        console.log('No FCM token found');
        return true;
      }

      // Remove token from server
      await apiRequest('/api/notifications/unsubscribe', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: this.fcmToken,
        }),
      });

      this.fcmToken = null;
      console.log('FCM token unsubscription successful');
      return true;
    } catch (error) {
      console.error('Failed to unsubscribe from FCM:', error);
      return false;
    }
  }

  async isSubscribed(): Promise<boolean> {
    try {
      return this.fcmToken !== null;
    } catch (error) {
      console.error('Failed to check subscription status:', error);
      return false;
    }
  }

  getToken(): string | null {
    return this.fcmToken;
  }
}

export const pushNotificationService = new PushNotificationService();