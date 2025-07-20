'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';

export function PushNotificationTest() {
  const { session } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleTestNotification = async () => {
    if (!session?.token) {
      toast.error('Please log in first');
      return;
    }

    setIsLoading(true);
    
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Test notification sent! Check your device.');
      } else {
        toast.error(data.message || 'Failed to send test notification');
        console.error('Test notification error:', data);
      }
    } catch (error) {
      console.error('Error sending test notification:', error);
      toast.error('Failed to send test notification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleTestNotification}
      disabled={isLoading}
      variant="outline"
      size="sm"
      className="gap-2"
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Sending...
        </>
      ) : (
        <>
          <BellRing className="h-4 w-4" />
          Test Notification
        </>
      )}
    </Button>
  );
}