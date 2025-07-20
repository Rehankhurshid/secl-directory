import webpush from 'web-push'
import { db } from '@/lib/db'
import { pushSubscriptions, groupMembers } from '@/lib/database/schema'
import { eq, and, inArray } from 'drizzle-orm'

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_EMAIL || 'mailto:admin@example.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '',
  process.env.VAPID_PRIVATE_KEY || ''
)

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  tag?: string
  data?: any
}

export class PushNotificationSender {
  /**
   * Send notification to a specific employee
   */
  static async sendToEmployee(
    employeeId: string,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      // Get all push subscriptions for this employee
      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(eq(pushSubscriptions.employeeId, employeeId))

      // Send to all subscriptions
      await Promise.all(
        subscriptions.map(sub => this.sendNotification(sub, payload))
      )
    } catch (error) {
      console.error('Failed to send notification to employee:', error)
    }
  }

  /**
   * Send notification to all members of a group
   */
  static async sendToGroup(
    groupId: number,
    payload: NotificationPayload,
    excludeEmployeeId?: string
  ): Promise<void> {
    try {
      // Get all group members
      const members = await db
        .select({ employeeId: groupMembers.employeeId })
        .from(groupMembers)
        .where(eq(groupMembers.groupId, groupId))

      const memberIds = members
        .map(m => m.employeeId)
        .filter(id => id !== excludeEmployeeId)

      if (memberIds.length === 0) return

      // Get push subscriptions for all members
      const subscriptions = await db
        .select()
        .from(pushSubscriptions)
        .where(inArray(pushSubscriptions.employeeId, memberIds))

      // Send to all subscriptions
      await Promise.all(
        subscriptions.map(sub => this.sendNotification(sub, payload))
      )
    } catch (error) {
      console.error('Failed to send notification to group:', error)
    }
  }

  /**
   * Send notification for a new message
   */
  static async sendMessageNotification(
    groupId: number,
    groupName: string,
    senderName: string,
    senderId: string,
    messageContent: string
  ): Promise<void> {
    const payload: NotificationPayload = {
      title: groupName,
      body: `${senderName}: ${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}`,
      icon: '/icon-192.png',
      badge: '/icon-72.png',
      tag: `group-${groupId}`,
      data: {
        groupId,
        url: '/messaging'
      }
    }

    await this.sendToGroup(groupId, payload, senderId)
  }

  /**
   * Send a single notification
   */
  private static async sendNotification(
    subscription: any,
    payload: NotificationPayload
  ): Promise<void> {
    try {
      const pushSubscription = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      }

      await webpush.sendNotification(
        pushSubscription,
        JSON.stringify(payload)
      )
    } catch (error: any) {
      console.error('Failed to send push notification:', error)
      
      // If subscription is invalid, remove it
      if (error.statusCode === 410) {
        await db
          .delete(pushSubscriptions)
          .where(eq(pushSubscriptions.id, subscription.id))
      }
    }
  }
}