import { useEffect, useState } from 'react';
import { pushNotificationService } from '@/services/pushNotifications';
import { useToast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        setIsLoading(true);
        
        // Initialize push notification service
        const initialized = await pushNotificationService.initialize();
        setIsInitialized(initialized);

        if (!initialized) {
          setIsLoading(false);
          return;
        }

        // Check current permission status
        const permission = Notification.permission === 'granted';
        setHasPermission(permission);

        // Check if already subscribed
        const subscribed = await pushNotificationService.isSubscribed();
        setIsSubscribed(subscribed);

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize push notifications:', error);
        setIsLoading(false);
      }
    };

    initializePushNotifications();
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (!isInitialized) return false;

      const granted = await pushNotificationService.requestPermission();
      setHasPermission(granted);

      if (granted) {
        toast({
          title: "Notifications Enabled",
          description: "You'll now receive push notifications for new messages.",
        });
      } else {
        toast({
          title: "Notifications Blocked",
          description: "Please enable notifications in your browser settings.",
          variant: "destructive",
        });
      }

      return granted;
    } catch (error) {
      console.error('Failed to request permission:', error);
      toast({
        title: "Permission Error",
        description: "Failed to request notification permissions.",
        variant: "destructive",
      });
      return false;
    }
  };

  const subscribe = async (): Promise<boolean> => {
    try {
      if (!isInitialized || !hasPermission) {
        const permissionGranted = await requestPermission();
        if (!permissionGranted) return false;
      }

      const subscribed = await pushNotificationService.subscribe();
      setIsSubscribed(subscribed);

      if (subscribed) {
        toast({
          title: "Push Notifications Enabled",
          description: "You'll receive notifications for new messages.",
        });
      } else {
        toast({
          title: "Subscription Failed",
          description: "Failed to enable push notifications.",
          variant: "destructive",
        });
      }

      return subscribed;
    } catch (error) {
      console.error('Failed to subscribe:', error);
      toast({
        title: "Subscription Error",
        description: "Failed to subscribe to push notifications.",
        variant: "destructive",
      });
      return false;
    }
  };

  const unsubscribe = async (): Promise<boolean> => {
    try {
      const unsubscribed = await pushNotificationService.unsubscribe();
      setIsSubscribed(!unsubscribed);

      if (unsubscribed) {
        toast({
          title: "Push Notifications Disabled",
          description: "You'll no longer receive push notifications.",
        });
      } else {
        toast({
          title: "Unsubscription Failed",
          description: "Failed to disable push notifications.",
          variant: "destructive",
        });
      }

      return unsubscribed;
    } catch (error) {
      console.error('Failed to unsubscribe:', error);
      toast({
        title: "Unsubscription Error",
        description: "Failed to unsubscribe from push notifications.",
        variant: "destructive",
      });
      return false;
    }
  };

  const isSupported = (): boolean => {
    return 'serviceWorker' in navigator && 'PushManager' in window;
  };

  return {
    isInitialized,
    isSubscribed,
    hasPermission,
    isLoading,
    isSupported: isSupported(),
    requestPermission,
    subscribe,
    unsubscribe,
  };
}