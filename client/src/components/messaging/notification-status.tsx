import { Bell, BellOff, BellRing } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNativeNotifications } from '@/hooks/use-native-notifications';

export function NotificationStatus() {
  const { permission, isSupported, requestPermission } = useNativeNotifications();

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <BellOff className="h-4 w-4" />
        <span className="text-sm">Not supported</span>
      </div>
    );
  }

  if (permission === 'granted') {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <BellRing className="h-4 w-4" />
        <span className="text-sm">Notifications enabled</span>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <BellOff className="h-4 w-4" />
        <span className="text-sm">Notifications blocked</span>
      </div>
    );
  }

  // Default state - show enable button
  return (
    <Button
      onClick={requestPermission}
      variant="outline"
      size="sm"
      className="flex items-center gap-2"
    >
      <Bell className="h-4 w-4" />
      <span className="text-sm">Enable notifications</span>
    </Button>
  );
}