'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '@/contexts/notifications/NotificationContext';

export function NotificationPermissionBanner() {
  const { permission, isSupported, requestPermission } = useNotifications();
  const [showBanner, setShowBanner] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);

  useEffect(() => {
    // Show banner if notifications are supported and permission is default
    // Also check if user hasn't dismissed the banner before
    const dismissed = localStorage.getItem('notification-banner-dismissed');
    if (isSupported && permission === 'default' && !dismissed) {
      // Show banner after a short delay to avoid being too intrusive
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSupported, permission]);

  const handleEnableNotifications = async () => {
    setIsRequesting(true);
    try {
      const result = await requestPermission();
      if (result === 'granted' || result === 'denied') {
        setShowBanner(false);
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleDismiss = () => {
    setShowBanner(false);
    // Remember that user dismissed the banner
    localStorage.setItem('notification-banner-dismissed', 'true');
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="border-primary/20 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm mb-1">
                Enable Push Notifications
              </h3>
              <p className="text-xs text-muted-foreground mb-3">
                Get instant alerts when you receive new messages, even when the app is closed.
              </p>
              
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  onClick={handleEnableNotifications}
                  disabled={isRequesting}
                  className="h-8"
                >
                  {isRequesting ? 'Enabling...' : 'Enable Notifications'}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleDismiss}
                  className="h-8 text-muted-foreground"
                >
                  Not Now
                </Button>
              </div>
            </div>
            
            <Button
              size="icon"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 w-8 -mr-2 -mt-2"
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Dismiss</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}