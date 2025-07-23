"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Download, CheckCircle, XCircle, AlertTriangle, Smartphone } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { toast } from 'sonner';
import { AppLayout } from '@/components/layout/app-layout';

export default function PWADebugPage() {
  const { isSupported, permission, requestPermission, showNotification } = useNotifications();
  const [isInstalled, setIsInstalled] = useState(false);
  const [canInstall, setCanInstall] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    // Check if running as installed PWA
    setIsInstalled(window.matchMedia('(display-mode: standalone)').matches);
    
    // Check online status
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRequestPermission = async () => {
    setIsLoading(true);
    try {
      const result = await requestPermission();
      if (result === 'granted') {
        // Send welcome notification
        const success = await showNotification('SECL Messaging', {
          body: 'Notifications are now enabled! You\'ll receive alerts for new messages.',
          requireInteraction: true
        });
        if (success) {
          toast.success('🎉 Welcome notification sent!');
        }
      }
    } catch (error) {
      toast.error('Error requesting permission');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestNotification = async () => {
    setTestLoading(true);
    try {
      if (permission === 'granted') {
        const success = await showNotification('🔔 Test Notification', {
          body: 'This is a test notification from SECL Messaging PWA!',
          requireInteraction: false
        });
        if (success) {
          toast.success('✅ Test notification sent successfully!');
        } else {
          toast.error('❌ Failed to send test notification');
        }
      } else {
        toast.warning('⚠️ Please enable notifications first!');
      }
    } catch (error) {
      toast.error('❌ Error sending test notification');
    } finally {
      setTestLoading(false);
    }
  };

  const handleSelfPushTest = async () => {
    try {
      if (permission === 'granted') {
        const success = await showNotification('🚀 Self Push Test', {
          body: 'This is a self-triggered push notification test!',
          requireInteraction: true,
          tag: 'self-push-test'
        });
        if (success) {
          toast.success('🎯 Self push notification sent!');
        }
      } else {
        toast.warning('Please enable notifications first!');
      }
    } catch (error) {
      toast.error('Error with self push test');
    }
  };

  const getStatusBadge = (condition: boolean, trueText: string, falseText: string) => {
    return (
      <Badge variant={condition ? "default" : "destructive"} className="ml-2">
        {condition ? (
          <>
            <CheckCircle className="w-3 h-3 mr-1" />
            {trueText}
          </>
        ) : (
          <>
            <XCircle className="w-3 h-3 mr-1" />
            {falseText}
          </>
        )}
      </Badge>
    );
  };

  const getPermissionBadge = (perm: NotificationPermission) => {
    switch (perm) {
      case 'granted':
        return <Badge variant="default" className="ml-2 bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Granted</Badge>;
      case 'denied':
        return <Badge variant="destructive" className="ml-2"><XCircle className="w-3 h-3 mr-1" />Denied</Badge>;
      default:
        return <Badge variant="outline" className="ml-2"><AlertTriangle className="w-3 h-3 mr-1" />Default</Badge>;
    }
  };

  return (
    <AppLayout>
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">🔧 PWA Debug Dashboard</h1>
        <p className="text-muted-foreground">Test and debug PWA features including notifications</p>
      </div>

      {/* PWA Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Smartphone className="w-4 h-4 mr-2" />
              PWA Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Installed</span>
                {getStatusBadge(isInstalled, "Yes", "No")}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Online</span>
                {getStatusBadge(isOnline, "Yes", "Offline")}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Bell className="w-4 h-4 mr-2" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Supported</span>
                {getStatusBadge(isSupported, "Yes", "No")}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Permission</span>
                {getPermissionBadge(permission)}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Service Worker
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Supported</span>
                {getStatusBadge('serviceWorker' in navigator, "Yes", "No")}
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Active</span>
                {getStatusBadge(!!navigator.serviceWorker?.controller, "Yes", "No")}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notification Testing */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bell className="w-5 h-5 mr-2" />
            Notification Testing
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={handleRequestPermission} 
                disabled={isLoading || permission === 'granted'}
                variant={permission === 'granted' ? 'outline' : 'default'}
              >
                {isLoading ? 'Requesting...' : 'Request Permission'}
              </Button>

              <Button 
                onClick={handleTestNotification}
                disabled={testLoading || permission !== 'granted'}
                variant="outline"
              >
                <Bell className="w-4 h-4 mr-2" />
                {testLoading ? 'Sending...' : 'Test Notification'}
              </Button>

              <Button 
                onClick={handleSelfPushTest}
                disabled={permission !== 'granted'}
                variant="outline"
              >
                <Bell className="w-4 h-4 mr-2" />
                Self Push Test
              </Button>
            </div>

            {permission === 'denied' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  ⚠️ <strong>Notifications are blocked.</strong> To enable them:
                  <br />
                  • Click the 🔒 icon in your browser's address bar
                  <br />
                  • Select "Allow" for notifications
                  <br />
                  • Refresh the page
                </p>
              </div>
            )}

            {permission === 'default' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-700">
                  💡 <strong>Notification permission not set.</strong> Click "Request Permission" to enable notifications.
                </p>
              </div>
            )}

            {permission === 'granted' && (
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                <p className="text-sm text-green-700">
                  ✅ <strong>Notifications are enabled!</strong> You can now test notifications using the buttons above.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Debug Information */}
      <Card>
        <CardHeader>
          <CardTitle>Debug Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm font-mono">
            <div><strong>User Agent:</strong> {navigator.userAgent}</div>
            <div><strong>Platform:</strong> {navigator.platform}</div>
            <div><strong>Notification Support:</strong> {isSupported ? 'Yes' : 'No'}</div>
            <div><strong>Service Worker Support:</strong> {'serviceWorker' in navigator ? 'Yes' : 'No'}</div>
            <div><strong>Current Permission:</strong> {permission}</div>
            <div><strong>Display Mode:</strong> {isInstalled ? 'Standalone' : 'Browser'}</div>
            <div><strong>Connection:</strong> {isOnline ? 'Online' : 'Offline'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
    </AppLayout>
  );
} 