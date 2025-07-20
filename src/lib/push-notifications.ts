'use client'

interface PushSubscriptionJSON {
  endpoint: string
  expirationTime: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

export class PushNotificationService {
  private static instance: PushNotificationService
  private serviceWorkerReady = false

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.log('Push notifications are not supported')
      return false
    }

    try {
      // Register service worker
      const registration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', registration)
      
      // Wait for service worker to be ready
      await navigator.serviceWorker.ready
      this.serviceWorkerReady = true
      
      return true
    } catch (error) {
      console.error('Failed to register service worker:', error)
      return false
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return 'denied'
    }

    // Don't request if already denied
    if (Notification.permission === 'denied') {
      console.log('Notifications are already denied')
      return 'denied'
    }

    // Return current permission if already granted
    if (Notification.permission === 'granted') {
      console.log('Notifications already granted')
      return 'granted'
    }

    // Request permission
    const permission = await Notification.requestPermission()
    console.log('Notification permission result:', permission)
    return permission
  }

  async subscribe(token: string): Promise<PushSubscriptionJSON | null> {
    try {
      if (!this.serviceWorkerReady) {
        await this.initialize()
      }

      const registration = await navigator.serviceWorker.ready
      
      // Check if already subscribed
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Create new subscription
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        
        if (!vapidPublicKey) {
          console.error('VAPID public key not found. Please add NEXT_PUBLIC_VAPID_PUBLIC_KEY to your .env.local file')
          console.error('Generate keys with: npm run generate:vapid')
          return null
        }

        console.log('Creating push subscription with VAPID key...')
        try {
          subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey)
          })
          console.log('Push subscription created successfully')
        } catch (subError) {
          console.error('Failed to create push subscription:', subError)
          throw subError
        }
      }

      const subscriptionJSON = subscription.toJSON() as PushSubscriptionJSON

      // Save subscription to server
      await this.saveSubscription(subscriptionJSON, token)

      return subscriptionJSON
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async unsubscribe(token: string): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        await this.removeSubscription(token)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to unsubscribe from push notifications:', error)
      return false
    }
  }

  private async saveSubscription(subscription: PushSubscriptionJSON, token: string): Promise<void> {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ subscription })
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }
    } catch (error) {
      console.error('Failed to save subscription:', error)
      throw error
    }
  }

  private async removeSubscription(token: string): Promise<void> {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to remove subscription')
      }
    } catch (error) {
      console.error('Failed to remove subscription:', error)
      throw error
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }

  // Queue message for background sync if offline
  async queueMessage(groupId: number, content: string, token: string): Promise<void> {
    if (!('indexedDB' in window)) {
      console.error('IndexedDB not supported')
      return
    }

    const db = await this.openDB()
    const tx = db.transaction('queued-messages', 'readwrite')
    await tx.objectStore('queued-messages').add({
      groupId,
      content,
      token,
      timestamp: Date.now()
    })

    // Register sync event
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      const registration = await navigator.serviceWorker.ready
      await registration.sync.register('send-messages')
    }
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('secl-directory', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('queued-messages')) {
          db.createObjectStore('queued-messages', { keyPath: 'id', autoIncrement: true })
        }
      }
    })
  }
}