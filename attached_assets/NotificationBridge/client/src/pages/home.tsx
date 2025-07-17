import { useState } from 'react';
import { Bell, CheckCircle, Loader2, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useNotifications } from '@/hooks/use-notifications';
import { PWAInstallPrompt } from '@/components/pwa-install-prompt';
import { NotificationStatus } from '@/components/notification-status';
import { StatusCards } from '@/components/status-cards';
import { toast } from 'react-toastify';

export default function Home() {
  const { permission, requestPermission, showNotification } = useNotifications();
  const [isLoading, setIsLoading] = useState(false);

  const handleMainNotification = async () => {
    setIsLoading(true);
    
    try {
      if (permission === 'granted') {
        const success = await showNotification('PWA Notification Demo', {
          body: 'This notification was triggered by clicking the button!',
          requireInteraction: true
        });
        if (success) {
          toast.success('Notification sent successfully!');
        } else {
          toast.error('Failed to send notification');
        }
      } else if (permission === 'default') {
        const result = await requestPermission();
        if (result === 'granted') {
          const success = await showNotification('PWA Notification Demo', {
            body: 'Welcome! Notifications are now enabled.',
            requireInteraction: true
          });
          if (success) {
            toast.success('Notification sent successfully!');
          }
        }
      } else {
        toast.error('Notifications are blocked. Please enable them in your browser settings.');
      }
    } catch (error) {
      toast.error('Error sending notification');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestPermission = () => {
    requestPermission();
  };

  const handleTestNotification = async () => {
    if (permission === 'granted') {
      const success = await showNotification('Test Notification', {
        body: 'This is a test notification with custom options!',
        requireInteraction: false
      });
      if (success) {
        toast.success('Test notification sent!');
      } else {
        toast.error('Failed to send test notification');
      }
    } else {
      toast.warning('Please enable notifications first!');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PWAInstallPrompt />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">PWA Notification Demo</h1>
                <p className="text-sm text-gray-600">Click to trigger browser notifications</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <NotificationStatus />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <StatusCards />

        {/* Main Action Card */}
        <Card className="bg-white shadow-sm border border-gray-200 p-8 text-center mb-8">
          <CardContent className="p-0">
            <div className="mb-8">
              <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Bell className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Trigger Notifications</h2>
              <p className="text-gray-600 max-w-md mx-auto">
                Click the button below to test browser notifications. Make sure to allow notifications when prompted.
              </p>
            </div>

            <div className="space-y-4">
              <Button
                onClick={handleMainNotification}
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold shadow-md hover:shadow-lg transition-all duration-200"
                size="lg"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Bell className="w-5 h-5 mr-2" />
                    Send Notification
                  </>
                )}
              </Button>

              <div className="flex justify-center space-x-4">
                <Button
                  onClick={handleRequestPermission}
                  variant="secondary"
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700"
                >
                  Request Permission
                </Button>
                <Button
                  onClick={handleTestNotification}
                  className="bg-pink-600 hover:bg-pink-700 text-white"
                >
                  Test Notification
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Features</h3>
              <ul className="space-y-3">
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Progressive Web App</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Browser Notifications</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Offline Support</span>
                </li>
                <li className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-gray-700">Cross-browser Compatible</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-sm border border-gray-200">
            <CardContent className="p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Browser Support</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Chrome</span>
                  <span className="text-green-500 font-semibold">✓ Supported</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Firefox</span>
                  <span className="text-green-500 font-semibold">✓ Supported</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Safari</span>
                  <span className="text-orange-500 font-semibold">⚠ Limited</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Edge</span>
                  <span className="text-green-500 font-semibold">✓ Supported</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 PWA Notification Demo. Built with modern web technologies.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
