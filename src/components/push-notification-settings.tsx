'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { PushNotificationService } from '@/lib/push-notifications'
import { useToast } from '@/components/ui/use-toast'

export default function PushNotificationSettings() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  
  const pushService = PushNotificationService.getInstance()
  const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null

  useEffect(() => {
    // Check current permission status
    if ('Notification' in window) {
      setPermission(Notification.permission)
      setNotificationsEnabled(Notification.permission === 'granted')
    }

    // Initialize service worker
    pushService.initialize()
  }, [])

  const handleToggleNotifications = async () => {
    if (!token) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to enable notifications',
        variant: 'destructive'
      })
      return
    }

    setIsLoading(true)

    try {
      if (!notificationsEnabled) {
        // Request permission
        const perm = await pushService.requestPermission()
        setPermission(perm)

        if (perm === 'granted') {
          // Subscribe to push notifications
          const subscription = await pushService.subscribe(token)
          
          if (subscription) {
            setNotificationsEnabled(true)
            toast({
              title: 'Notifications enabled',
              description: 'You will now receive push notifications for new messages'
            })
          } else {
            throw new Error('Failed to subscribe')
          }
        } else if (perm === 'denied') {
          toast({
            title: 'Permission denied',
            description: 'Please enable notifications in your browser settings',
            variant: 'destructive'
          })
        }
      } else {
        // Unsubscribe from push notifications
        const success = await pushService.unsubscribe(token)
        
        if (success) {
          setNotificationsEnabled(false)
          toast({
            title: 'Notifications disabled',
            description: 'You will no longer receive push notifications'
          })
        } else {
          throw new Error('Failed to unsubscribe')
        }
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error)
      toast({
        title: 'Error',
        description: 'Failed to update notification settings',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTestNotification = async () => {
    if (!notificationsEnabled) {
      toast({
        title: 'Notifications disabled',
        description: 'Please enable notifications first',
        variant: 'destructive'
      })
      return
    }

    try {
      // Show test notification
      const notification = new Notification('SECL Directory', {
        body: 'This is a test notification',
        icon: '/icon-192.png',
        badge: '/icon-72.png',
        vibrate: [200, 100, 200]
      })

      notification.onclick = () => {
        window.focus()
        notification.close()
      }

      toast({
        title: 'Test notification sent',
        description: 'Check your system notifications'
      })
    } catch (error) {
      console.error('Failed to show test notification:', error)
      toast({
        title: 'Error',
        description: 'Failed to show test notification',
        variant: 'destructive'
      })
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Receive instant notifications for new messages
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications" className="flex items-center gap-2">
            <span>Enable notifications</span>
            {permission === 'denied' && (
              <span className="text-xs text-destructive">(Blocked by browser)</span>
            )}
          </Label>
          <Switch
            id="notifications"
            checked={notificationsEnabled}
            onCheckedChange={handleToggleNotifications}
            disabled={isLoading || permission === 'denied'}
          />
        </div>

        {notificationsEnabled && (
          <div className="space-y-4">
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-green-600" />
                <span>Push notifications are active</span>
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                You'll receive notifications even when the app is closed
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleTestNotification}
              className="w-full"
            >
              Send Test Notification
            </Button>
          </div>
        )}

        {permission === 'denied' && (
          <div className="rounded-lg bg-destructive/10 p-3 text-sm">
            <p className="flex items-center gap-2">
              <BellOff className="w-4 h-4 text-destructive" />
              <span>Notifications blocked</span>
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Please enable notifications in your browser settings
            </p>
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}