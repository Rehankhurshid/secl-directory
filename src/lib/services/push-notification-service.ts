import webpush from 'web-push';
import { db } from '@/lib/db';
import { pushSubscriptions, groupMembers, groups } from '@/lib/database/schema';
import { eq, inArray, and } from 'drizzle-orm';

// Configure VAPID details
const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
const vapidEmail = process.env.VAPID_EMAIL || 'admin@secl.co.in';

if (!vapidPublicKey || !vapidPrivateKey) {
  console.error('❌ VAPID keys not configured properly');
} else {
  webpush.setVapidDetails(
    `mailto:${vapidEmail}`,
    vapidPublicKey,
    vapidPrivateKey
  );
  console.log('✅ VAPID configured for push notifications');
}

interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: object;
}

class PushNotificationService {
  /**
   * Send push notification to a specific employee
   */
  async sendToEmployee(employeeId: string, payload: PushNotificationPayload): Promise<boolean> {
    try {
      console.log(`📬 Sending push notification to employee: ${employeeId}`);
      
      // Get push subscriptions for the employee
      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.employee_id, employeeId));

      if (subscriptions.length === 0) {
        console.log(`📭 No push subscriptions found for employee: ${employeeId}`);
        return false;
      }

      console.log(`📬 Found ${subscriptions.length} subscription(s) for employee: ${employeeId}`);

      // Send notification to all subscriptions
      const promises = subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
              title: payload.title,
              body: payload.body,
              icon: payload.icon || '/icon-192x192.png',
              badge: payload.badge || '/icon-72x72.png',
              data: payload.data || {},
              timestamp: Date.now(),
            })
          );

          console.log(`✅ Push notification sent successfully to: ${subscription.endpoint.substring(0, 50)}...`);
          return true;
        } catch (error: any) {
          console.error(`❌ Failed to send push notification to: ${subscription.endpoint.substring(0, 50)}...`, error.message);
          
          // If subscription is invalid (410 Gone), remove it
          if (error.statusCode === 410) {
            console.log(`🗑️ Removing invalid subscription: ${subscription.id}`);
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, subscription.id));
          }
          
          return false;
        }
      });

      const results = await Promise.all(promises);
      return results.some(result => result === true);
    } catch (error) {
      console.error(`❌ Error sending push notification to employee ${employeeId}:`, error);
      return false;
    }
  }

  /**
   * Send push notification to all members of a group (except sender)
   */
  async sendToGroupMembers(
    groupId: number, 
    senderId: string, 
    payload: PushNotificationPayload
  ): Promise<void> {
    try {
      console.log(`📬 Sending push notifications to group ${groupId} members (excluding sender: ${senderId})`);
      
      // Validate groupId
      if (!groupId || isNaN(groupId)) {
        console.error(`❌ Invalid group ID: ${groupId}`);
        return;
      }

      // Get all group members except the sender
      const membersQuery = db
        .select({
          employee_id: groupMembers.employeeId
        })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId));

      const members = await membersQuery;
      console.log(`👥 Found ${members.length} total members in group ${groupId}`);

      // Filter out the sender
      const recipientIds = members
        .map(m => m.employee_id)
        .filter(id => id !== senderId);
      
      console.log(`📨 Sending to ${recipientIds.length} recipients:`, recipientIds);

      if (recipientIds.length === 0) {
        console.log(`📭 No recipients found for group ${groupId} (excluding sender ${senderId})`);
        return;
      }

      // Get push subscriptions for all recipients
      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(inArray(pushSubscriptions.employee_id, recipientIds));

      console.log(`📬 Found ${subscriptions.length} push subscription(s) for group ${groupId} members`);

      if (subscriptions.length === 0) {
        console.log(`📭 No push subscriptions found for conversation ${groupId} members`);
        return;
      }

      // Send notifications to all subscriptions
      const promises = subscriptions.map(async (subscription) => {
        try {
          const pushSubscription = {
            endpoint: subscription.endpoint,
            keys: {
              p256dh: subscription.p256dh,
              auth: subscription.auth,
            },
          };

          await webpush.sendNotification(
            pushSubscription,
            JSON.stringify({
              title: payload.title,
              body: payload.body,
              icon: payload.icon || '/icon-192x192.png',
              badge: payload.badge || '/icon-72x72.png',
              data: {
                groupId,
                senderId,
                ...payload.data,
              },
              timestamp: Date.now(),
            })
          );

          console.log(`✅ Push notification sent to: ${subscription.employee_id}`);
        } catch (error: any) {
          console.error(`❌ Failed to send push notification to: ${subscription.employee_id}`, error.message);
          
          // If subscription is invalid (410 Gone), remove it
          if (error.statusCode === 410) {
            console.log(`🗑️ Removing invalid subscription for: ${subscription.employee_id}`);
            await db
              .delete(pushSubscriptions)
              .where(eq(pushSubscriptions.id, subscription.id));
          }
        }
      });

      await Promise.all(promises);
      console.log(`📬 Push notifications sent for group: ${groupId}`);
    } catch (error) {
      console.error(`❌ Error sending push notifications to group ${groupId}:`, error);
    }
  }

  /**
   * Send a test notification to a specific employee
   */
  async sendTestNotification(employeeId: string): Promise<boolean> {
    return this.sendToEmployee(employeeId, {
      title: '🧪 Test Notification',
      body: 'This is a test push notification from SECL Messaging!',
      icon: '/icon-192x192.png',
      data: {
        type: 'test',
        timestamp: Date.now(),
      },
    });
  }

  /**
   * Get all push subscriptions for an employee (for debugging)
   */
  async getSubscriptionsForEmployee(employeeId: string) {
    try {
      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.employee_id, employeeId));

      return subscriptions.map(sub => ({
        id: sub.id,
        endpoint: sub.endpoint.substring(0, 50) + '...',
        platform: sub.platform,
        createdAt: sub.created_at,
      }));
    } catch (error) {
      console.error(`❌ Error getting subscriptions for employee ${employeeId}:`, error);
      return [];
    }
  }
}

export const pushNotificationService = new PushNotificationService(); 