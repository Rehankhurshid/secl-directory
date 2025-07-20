// lib/notifications/pushNotifications.ts
import { offlineQueue } from '../offline/messageQueue'

interface PushSubscriptionData {
  endpoint: string
  keys: {
    p256dh: string
    auth: string
  }
}

class PushNotificationManager {
  private swRegistration: ServiceWorkerRegistration | null = null

  async init() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications are not supported')
      return false
    }

    try {
      this.swRegistration = await navigator.serviceWorker.ready
      return true
    } catch (error) {
      console.error('Service worker not ready:', error)
      return false
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      console.warn('Notification permission denied')
      return false
    }

    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  async subscribe(): Promise<PushSubscriptionData | null> {
    if (!this.swRegistration) {
      await this.init()
    }

    if (!this.swRegistration) {
      console.error('Service worker not available')
      return null
    }

    const hasPermission = await this.requestPermission()
    if (!hasPermission) {
      return null
    }

    try {
      // Check if already subscribed
      let subscription = await this.swRegistration.pushManager.getSubscription()
      
      if (!subscription) {
        // Subscribe with your VAPID public key
        const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
        
        if (!vapidPublicKey) {
          console.error('VAPID public key not configured')
          return null
        }

        subscription = await this.swRegistration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(vapidPublicKey),
        })
      }

      // Extract subscription data
      const subscriptionData: PushSubscriptionData = {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(subscription.getKey('p256dh')!),
          auth: this.arrayBufferToBase64(subscription.getKey('auth')!),
        },
      }

      // Send subscription to server
      await this.sendSubscriptionToServer(subscriptionData)

      return subscriptionData
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error)
      return null
    }
  }

  async unsubscribe(): Promise<boolean> {
    if (!this.swRegistration) {
      return false
    }

    try {
      const subscription = await this.swRegistration.pushManager.getSubscription()
      
      if (subscription) {
        await subscription.unsubscribe()
        await this.removeSubscriptionFromServer(subscription.endpoint)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to unsubscribe:', error)
      return false
    }
  }

  private async sendSubscriptionToServer(subscription: PushSubscriptionData) {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      })
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
    }
  }

  private async removeSubscriptionFromServer(endpoint: string) {
    try {
      await fetch('/api/notifications/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ endpoint }),
      })
    } catch (error) {
      console.error('Failed to remove subscription from server:', error)
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }

  private arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    
    return window.btoa(binary)
  }
}

export const pushNotifications = new PushNotificationManager()

// React hook for push notifications
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false)
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkStatus()
  }, [])

  const checkStatus = async () => {
    setIsLoading(true)
    
    const supported = 'PushManager' in window && 'serviceWorker' in navigator
    setIsSupported(supported)
    
    if (supported) {
      await pushNotifications.init()
      
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsSubscribed(!!subscription)
    }
    
    setIsLoading(false)
  }

  const subscribe = async () => {
    setIsLoading(true)
    
    const subscription = await pushNotifications.subscribe()
    setIsSubscribed(!!subscription)
    
    setIsLoading(false)
    
    return !!subscription
  }

  const unsubscribe = async () => {
    setIsLoading(true)
    
    const success = await pushNotifications.unsubscribe()
    if (success) {
      setIsSubscribed(false)
    }
    
    setIsLoading(false)
    
    return success
  }

  return {
    isSupported,
    isSubscribed,
    isLoading,
    subscribe,
    unsubscribe,
  }
}

// Notification display helper
export function showNotification(
  title: string,
  options?: NotificationOptions & {
    data?: any
    actions?: Array<{
      action: string
      title: string
      icon?: string
    }>
  }
) {
  if (!('Notification' in window)) {
    return
  }

  if (Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        badge: '/icons/badge-72x72.png',
        icon: '/icons/icon-192x192.png',
        vibrate: [200, 100, 200],
        ...options,
      })
    })
  }
}