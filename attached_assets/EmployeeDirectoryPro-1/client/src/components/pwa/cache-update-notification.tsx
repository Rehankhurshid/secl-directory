import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowClockwise, X, Info } from "@phosphor-icons/react";

export function CacheUpdateNotification() {
  const [showUpdate, setShowUpdate] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    // Check if service worker is supported
    if ('serviceWorker' in navigator) {
      // Listen for service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShowUpdate(true);
      });

      // Check for waiting service worker
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          setShowUpdate(true);
        }
      });
    }
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    
    // Clear all caches
    if ('caches' in window) {
      try {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      } catch (error) {
        console.error('Failed to clear caches:', error);
      }
    }

    // Skip waiting service worker and reload
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      if (registration.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
    }

    // Force a hard reload
    window.location.reload();
  };

  const handleForceRefresh = () => {
    setIsRefreshing(true);
    // Force reload without cache
    window.location.reload();
  };

  if (!showUpdate) return null;

  return (
    <div className="fixed top-4 right-4 z-50 w-80">
      <Card className="shadow-lg border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium text-blue-900 dark:text-blue-100">
              <Info size={16} className="inline mr-2" />
              Update Available
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowUpdate(false)}
              className="h-6 w-6 p-0 text-blue-700 hover:text-blue-900 dark:text-blue-300"
            >
              <X size={12} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-blue-800 dark:text-blue-200 mb-3">
            A new version of the app is available. Refresh to get the latest features and fixes.
          </CardDescription>
          <div className="space-y-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              size="sm"
            >
              {isRefreshing ? (
                <>
                  <ArrowClockwise className="mr-2 animate-spin" size={16} />
                  Refreshing...
                </>
              ) : (
                <>
                  <ArrowClockwise className="mr-2" size={16} />
                  Refresh App
                </>
              )}
            </Button>
            <Button
              onClick={handleForceRefresh}
              disabled={isRefreshing}
              variant="outline"
              className="w-full text-blue-700 border-blue-300 hover:bg-blue-100 dark:text-blue-300 dark:border-blue-700"
              size="sm"
            >
              Force Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}