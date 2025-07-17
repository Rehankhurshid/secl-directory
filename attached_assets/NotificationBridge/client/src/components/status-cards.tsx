import { CheckCircle, Bell, Wifi } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { usePWA } from '@/hooks/use-pwa';
import { useNotifications } from '@/hooks/use-notifications';
import { useEffect, useState } from 'react';

export function StatusCards() {
  const { isSupported: isPWASupported, isInstalled } = usePWA();
  const { permission, isSupported: isNotificationsSupported } = useNotifications();
  const [isOfflineReady, setIsOfflineReady] = useState(false);

  useEffect(() => {
    // Check service worker registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration()
        .then(registration => {
          setIsOfflineReady(!!registration);
        });
    }
  }, []);

  const getPWAStatus = () => {
    if (!isPWASupported) return 'Not supported';
    if (isInstalled) return 'Installed';
    return 'Active';
  };

  const getNotificationStatus = () => {
    if (!isNotificationsSupported) return 'Not supported';
    switch (permission) {
      case 'granted': return 'Granted';
      case 'denied': return 'Denied';
      default: return 'Not requested';
    }
  };

  const getOfflineStatus = () => {
    return isOfflineReady ? 'Ready' : 'Checking...';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">PWA Status</h3>
              <p className="text-sm text-gray-600">{getPWAStatus()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Notifications</h3>
              <p className="text-sm text-gray-600">{getNotificationStatus()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
              <Bell className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Offline Ready</h3>
              <p className="text-sm text-gray-600">{getOfflineStatus()}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <Wifi className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
