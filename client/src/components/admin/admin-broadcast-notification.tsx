import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Bell, Send, AlertCircle, Info, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function AdminBroadcastNotification() {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const { toast } = useToast();

  const sendBroadcastMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/notifications/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, body }),
      });
    },
    onSuccess: (data) => {
      toast({
        title: "Broadcast Sent Successfully",
        description: `Notification sent to ${data.sentCount || 0} users`,
      });
      // Clear form
      setTitle('');
      setBody('');
    },
    onError: (error) => {
      toast({
        title: "Broadcast Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendTestNotificationMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/notifications/test', {
        method: 'POST',
        body: JSON.stringify({ 
          title: title || 'Test Notification', 
          body: body || 'This is a test notification from the admin panel.' 
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Test Notification Sent",
        description: "Check your device for the notification",
      });
    },
    onError: (error) => {
      toast({
        title: "Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBroadcast = () => {
    if (!title.trim() || !body.trim()) {
      toast({
        title: "Missing Information",
        description: "Please enter both title and message",
        variant: "destructive",
      });
      return;
    }
    sendBroadcastMutation.mutate();
  };

  const handleTestNotification = () => {
    sendTestNotificationMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Broadcast Notification
          </CardTitle>
          <CardDescription>
            Send push notifications to all users with active subscriptions
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Notifications will only be delivered to users who have enabled push notifications in their settings.
            </AlertDescription>
          </Alert>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Notification Title</Label>
              <Input
                id="title"
                placeholder="Enter notification title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">
                {title.length}/100 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="body">Notification Message</Label>
              <Textarea
                id="body"
                placeholder="Enter notification message"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground">
                {body.length}/500 characters
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={handleBroadcast}
                disabled={sendBroadcastMutation.isPending || !title.trim() || !body.trim()}
                className="flex-1"
              >
                {sendBroadcastMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Broadcast
                  </>
                )}
              </Button>

              <Button
                onClick={handleTestNotification}
                disabled={sendTestNotificationMutation.isPending}
                variant="outline"
              >
                {sendTestNotificationMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2" />
                    Testing...
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-4 h-4 mr-2" />
                    Test Notification
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Android Troubleshooting Guide */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            Android Notification Troubleshooting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              If notifications are not working on Android, please check the following:
            </AlertDescription>
          </Alert>

          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Enable Notifications in Android Settings</p>
                <p className="text-muted-foreground">Go to Settings → Apps → Employee Directory → Notifications → Enable all notification categories</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Check Battery Optimization</p>
                <p className="text-muted-foreground">Settings → Battery → Battery Optimization → Employee Directory → Don't optimize</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Clear Browser Cache</p>
                <p className="text-muted-foreground">Chrome → Settings → Privacy → Clear browsing data → Cached images and files</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Re-enable Push Notifications</p>
                <p className="text-muted-foreground">Go to Messages → Settings → Disable then Enable push notifications again</p>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Check Do Not Disturb Mode</p>
                <p className="text-muted-foreground">Ensure your device is not in Do Not Disturb or Silent mode</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}