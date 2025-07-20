'use client';

import { PushNotificationOptIn } from '@/components/push-notification-opt-in';
import { useAuth } from '@/lib/hooks/use-auth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Info } from 'lucide-react';

export default function NotificationSettingsPage() {
  const { employee } = useAuth();
  const token = typeof window !== 'undefined' ? localStorage.getItem('sessionToken') : null;

  if (!employee || !token) {
    return (
      <div className="container mx-auto py-8 px-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Please log in to manage your notification settings.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Notification Settings</h1>
      
      <div className="max-w-2xl space-y-6">
        <PushNotificationOptIn token={token} />
        
        <div className="p-4 bg-muted rounded-lg space-y-4">
          <div>
            <h2 className="font-semibold mb-2">About Push Notifications</h2>
            <p className="text-sm text-muted-foreground">
              Push notifications help you stay connected with your team. You'll receive 
              instant alerts for new messages, even when the app is running in the background 
              or closed. All notifications respect your device's Do Not Disturb settings.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Platform Support</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• <strong>Android:</strong> Full support for background notifications</li>
              <li>• <strong>iOS (Safari):</strong> Requires iOS 16.4+ and app added to home screen</li>
              <li>• <strong>Desktop:</strong> Chrome, Firefox, Edge, and Safari support</li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-medium mb-2">Privacy & Security</h3>
            <p className="text-sm text-muted-foreground">
              Your notification preferences are stored securely and can be changed at any time. 
              We only send notifications for messages and important updates. No promotional content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}