import { useNotifications } from '@/hooks/use-notifications';
import { cn } from '@/lib/utils';

export function NotificationStatus() {
  const { permission } = useNotifications();

  const getStatusInfo = () => {
    switch (permission) {
      case 'granted':
        return {
          text: 'Enabled',
          className: 'status-granted',
          color: 'bg-green-500'
        };
      case 'denied':
        return {
          text: 'Blocked',
          className: 'status-denied',
          color: 'bg-red-500'
        };
      default:
        return {
          text: 'Pending',
          className: 'status-default',
          color: 'bg-orange-500'
        };
    }
  };

  const { text, className, color } = getStatusInfo();

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <div className="bg-gray-100 px-3 py-1 rounded-full relative">
        <span className="text-xs font-medium text-gray-700">{text}</span>
        <div className={cn("absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-white", color)} />
      </div>
    </div>
  );
}
