import { Bell, BellOff, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

export function NotificationSettings() {
  const {
    isInitialized,
    isSubscribed,
    hasPermission,
    isLoading,
    isSupported,
    requestPermission,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellOff className="h-5 w-5" />
            Push Notifications
          </CardTitle>
          <CardDescription>
            Push notifications are not supported in this browser.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To receive push notifications, please use a modern browser like Chrome, Firefox, or Safari.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Push Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <LoadingSpinner size="sm" />
            <span className="text-sm text-muted-foreground">
              Checking notification status...
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="h-5 w-5" />
          Push Notifications
        </CardTitle>
        <CardDescription>
          Get notified instantly when you receive new messages, even when the app is closed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Browser Permission</p>
            <p className="text-xs text-muted-foreground">
              Allow notifications in your browser
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={hasPermission ? "default" : "secondary"}>
              {hasPermission ? "Granted" : "Not granted"}
            </Badge>
            {!hasPermission && (
              <Button
                size="sm"
                variant="outline"
                onClick={requestPermission}
              >
                Enable
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium">Push Subscription</p>
            <p className="text-xs text-muted-foreground">
              Subscribe to receive push notifications
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isSubscribed ? "default" : "secondary"}>
              {isSubscribed ? "Active" : "Inactive"}
            </Badge>
            {isInitialized && hasPermission && (
              <Button
                size="sm"
                variant={isSubscribed ? "outline" : "default"}
                onClick={isSubscribed ? unsubscribe : subscribe}
              >
                {isSubscribed ? "Disable" : "Enable"}
              </Button>
            )}
          </div>
        </div>

        {isSubscribed && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-sm text-green-800 dark:text-green-200">
                You're subscribed to push notifications! You'll receive notifications for new messages in your groups.
              </p>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <p className="text-sm font-medium">What you'll get notified about:</p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• New messages in your groups</li>
            <li>• System announcements</li>
            <li>• Important updates</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}