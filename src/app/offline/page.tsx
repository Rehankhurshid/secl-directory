"use client";

/**
 * Offline Page
 * Displayed when the user is completely offline and no cached content is available
 */

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { ConnectionStatusIndicator } from '@/components/messaging/offline/connection-status-indicator';
import { 
  WifiOff, 
  RefreshCw, 
  MessageCircle, 
  Users, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  Home
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date>(new Date());
  const [isRetrying, setIsRetrying] = useState(false);
  const router = useRouter();

  // Check online status
  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
      setLastChecked(new Date());
    };

    updateOnlineStatus();

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);

    return () => {
      window.removeEventListener('online', updateOnlineStatus);
      window.removeEventListener('offline', updateOnlineStatus);
    };
  }, []);

  // Auto-redirect when back online
  useEffect(() => {
    if (isOnline) {
      const timer = setTimeout(() => {
        router.push('/messaging');
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, router]);

  const handleRetry = () => {
    setIsRetrying(true);
    setLastChecked(new Date());
    
    // Simulate retry delay
    setTimeout(() => {
      setIsRetrying(false);
      if (navigator.onLine) {
        router.push('/messaging');
      }
    }, 1000);
  };

  const handleGoHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-muted/30 to-muted/60 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-6">
        {/* Main Offline Card */}
        <Card className="border-2 border-dashed border-muted-foreground/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-4 rounded-full bg-muted/50">
              <WifiOff className="h-12 w-12 text-muted-foreground" />
            </div>
            
            <CardTitle className="text-2xl">You're Offline</CardTitle>
            <CardDescription className="text-base">
              No internet connection detected. Don't worry - SECL Messaging works offline too!
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Connection Status */}
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-3 h-3 rounded-full",
                  isOnline ? "bg-green-500" : "bg-red-500"
                )}>
                  {isOnline && <div className="w-3 h-3 bg-green-500 rounded-full animate-ping absolute" />}
                </div>
                <span className="font-medium">
                  {isOnline ? "Connection Restored!" : "No Connection"}
                </span>
              </div>
              
              <Badge variant={isOnline ? "default" : "secondary"}>
                {isOnline ? "Online" : "Offline"}
              </Badge>
            </div>

            {/* Auto-redirect notice */}
            {isOnline && (
              <Alert className="border-green-200 bg-green-50 text-green-800">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Connection restored! Redirecting to messaging in 2 seconds...
                </AlertDescription>
              </Alert>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
        <Button 
                onClick={handleRetry} 
                disabled={isRetrying || isOnline}
                className="flex-1"
              >
                <RefreshCw className={cn("h-4 w-4 mr-2", isRetrying && "animate-spin")} />
                {isRetrying ? "Checking..." : "Try Again"}
              </Button>
              
              <Button variant="outline" onClick={handleGoHome} className="flex-1">
                <Home className="h-4 w-4 mr-2" />
                Go Home
        </Button>
            </div>

            {/* Last Checked */}
            <div className="text-center text-sm text-muted-foreground">
              Last checked: {lastChecked.toLocaleTimeString()}
            </div>
          </CardContent>
        </Card>

        {/* Offline Features Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              What You Can Still Do Offline
            </CardTitle>
            <CardDescription>
              SECL Messaging continues working even without internet
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Send Messages</h4>
                    <p className="text-xs text-muted-foreground">
                      Messages are queued and sent when you're back online
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Browse Contacts</h4>
                    <p className="text-xs text-muted-foreground">
                      Access your cached employee directory
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Read History</h4>
                    <p className="text-xs text-muted-foreground">
                      View previously cached conversations
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <CheckCircle2 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Auto-Sync</h4>
                    <p className="text-xs text-muted-foreground">
                      Everything syncs automatically when online
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connection Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Connection Details</CardTitle>
          </CardHeader>
          <CardContent>
            <ConnectionStatusIndicator variant="detailed" />
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Pro Tip:</strong> You can still navigate to cached pages like Employee Directory or Settings. 
            Use your browser's back button or refresh once you're back online.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  );
}