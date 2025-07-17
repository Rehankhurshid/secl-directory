import admin from "firebase-admin";
import { storage } from "../storage";
import type { PushSubscription } from "@shared/schema";

// Initialize Firebase Admin SDK (optional for development)
if (
  !admin.apps.length &&
  process.env.FIREBASE_PROJECT_ID &&
  process.env.FIREBASE_PRIVATE_KEY &&
  process.env.FIREBASE_CLIENT_EMAIL
) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
    });
    console.log("Firebase Admin SDK initialized successfully");
  } catch (error) {
    console.warn("Firebase Admin SDK initialization failed:", error);
  }
} else {
  console.log(
    "Firebase Admin SDK skipped - missing credentials (optional for development)"
  );
}

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  renotify?: boolean;
  silent?: boolean;
  requireInteraction?: boolean;
  timestamp?: number;
  url?: string;
}

export class PushService {
  /**
   * Send a push notification to a specific employee
   */
  async sendToEmployee(
    employeeId: string,
    payload: PushNotificationPayload
  ): Promise<void> {
    const subscriptions = await storage.getPushSubscriptionsByEmployeeId(
      employeeId
    );

    if (subscriptions.length === 0) {
      console.log(`No push subscriptions found for employee: ${employeeId}`);
      return;
    }

    await this.sendToSubscriptions(subscriptions, payload);
  }

  /**
   * Send a push notification to multiple employees
   */
  async sendToEmployees(
    employeeIds: string[],
    payload: PushNotificationPayload
  ): Promise<void> {
    const promises = employeeIds.map((employeeId) =>
      this.sendToEmployee(employeeId, payload)
    );
    await Promise.all(promises);
  }

  /**
   * Send a push notification to all subscribed users
   */
  async sendToAll(payload: PushNotificationPayload): Promise<void> {
    const subscriptions = await storage.getAllPushSubscriptions();

    if (subscriptions.length === 0) {
      console.log("No push subscriptions found");
      return;
    }

    await this.sendToSubscriptions(subscriptions, payload);
  }

  /**
   * Send a push notification to a specific subscription (FCM token)
   */
  async sendToSubscription(
    subscription: PushSubscription,
    payload: PushNotificationPayload
  ): Promise<boolean> {
    try {
      // For FCM implementation, the endpoint contains the FCM token
      const token = subscription.endpoint;

      const message = {
        token: token,
        notification: {
          title: payload.title,
          body: payload.body,
        },
        data: {
          ...payload.data,
          url: payload.url || "/",
          timestamp: (payload.timestamp || Date.now()).toString(),
        },
        android: {
          notification: {
            icon: "ic_notification",
            color: "#4F46E5",
            sound: "default",
            channelId: "default",
          },
          priority: "high" as const,
        },
        apns: {
          payload: {
            aps: {
              sound: "default",
              badge: 1,
            },
          },
        },
        webpush: {
          notification: {
            title: payload.title,
            body: payload.body,
            icon: payload.icon || "/icon-192x192.png",
            badge: payload.badge || "/icon-192x192.png",
            tag: payload.tag,
            renotify: payload.renotify || false,
            silent: payload.silent || false,
            requireInteraction: payload.requireInteraction || false,
            timestamp: payload.timestamp || Date.now(),
            vibrate: [200, 100, 200],
            actions: payload.actions || [],
            data: payload.data || {},
          },
        },
      };

      const result = await admin.messaging().send(message);
      console.log("FCM notification sent successfully:", result);
      return true;
    } catch (error: any) {
      console.error("Error sending FCM notification:", error);

      // Handle expired or invalid tokens
      if (
        error.code === "messaging/registration-token-not-registered" ||
        error.code === "messaging/invalid-registration-token"
      ) {
        console.log("FCM token expired or invalid, removing from database");
        await storage.deletePushSubscription(subscription.endpoint);
      }

      return false;
    }
  }

  /**
   * Send a push notification to multiple subscriptions
   */
  private async sendToSubscriptions(
    subscriptions: PushSubscription[],
    payload: PushNotificationPayload
  ): Promise<void> {
    const promises = subscriptions.map((subscription) =>
      this.sendToSubscription(subscription, payload)
    );
    const results = await Promise.all(promises);

    const successful = results.filter((result) => result).length;
    const failed = results.length - successful;

    console.log(
      `Push notifications sent: ${successful} successful, ${failed} failed`
    );
  }

  /**
   * Send a group message notification
   */
  async sendGroupMessageNotification(
    groupId: number,
    senderName: string,
    message: string,
    excludeEmployeeId?: string
  ): Promise<void> {
    try {
      const group = await storage.getGroupById(groupId);
      if (!group) {
        console.error(`Group not found: ${groupId}`);
        return;
      }

      const members = await storage.getGroupMembers(groupId);
      const recipientIds = members
        .filter((member) => member.employeeId !== excludeEmployeeId)
        .map((member) => member.employeeId);

      if (recipientIds.length === 0) {
        console.log("No recipients for group message notification");
        return;
      }

      const payload: PushNotificationPayload = {
        title: `${group.name}`,
        body: `${senderName}: ${message}`,
        icon: "/icon-192x192.png",
        badge: "/icon-192x192.png",
        data: {
          type: "group_message",
          groupId: groupId,
          senderId: excludeEmployeeId,
          url: `/groups/${groupId}`,
        },
        actions: [
          {
            action: "reply",
            title: "Reply",
            icon: "/icon-192x192.png",
          },
          {
            action: "view",
            title: "View",
            icon: "/icon-192x192.png",
          },
        ],
        tag: `group_${groupId}`,
        renotify: true,
        requireInteraction: false,
        url: `/groups/${groupId}`,
      };

      await this.sendToEmployees(recipientIds, payload);
    } catch (error) {
      console.error("Error sending group message notification:", error);
    }
  }

  /**
   * Send a system notification
   */
  async sendSystemNotification(
    title: string,
    message: string,
    targetEmployeeIds?: string[]
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title,
      body: message,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: {
        type: "system",
        timestamp: Date.now(),
      },
      tag: "system_notification",
      renotify: true,
      requireInteraction: true,
    };

    if (targetEmployeeIds && targetEmployeeIds.length > 0) {
      await this.sendToEmployees(targetEmployeeIds, payload);
    } else {
      await this.sendToAll(payload);
    }
  }

  /**
   * Send a test notification to a specific employee
   */
  async sendTestNotification(
    employeeId: string,
    title: string,
    message: string
  ): Promise<void> {
    const payload: PushNotificationPayload = {
      title,
      body: message,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data: {
        type: "test",
        timestamp: Date.now(),
      },
      tag: "test_notification",
      renotify: true,
      requireInteraction: false,
    };

    await this.sendToEmployee(employeeId, payload);
  }

  /**
   * Get the Firebase configuration for client-side usage
   */
  getFirebaseConfig(): any {
    return {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: `${process.env.FIREBASE_PROJECT_ID}.firebaseapp.com`,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: `${process.env.FIREBASE_PROJECT_ID}.appspot.com`,
      messagingSenderId: process.env.FIREBASE_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };
  }

  /**
   * Get the VAPID public key for FCM web push
   */
  getVapidPublicKey(): string {
    return (
      process.env.FIREBASE_VAPID_KEY ||
      "BEl62iUYgUivxIkv69yViEuiBIa40HI8DLLhGXVGUvJMo7wZyZMcjzMFHLvYdEJgzWGdWjGzAm5-VYvJ8SyI0zw"
    );
  }
}

export const pushService = new PushService();
