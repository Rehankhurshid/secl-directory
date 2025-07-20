'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from '@/components/ui/use-toast';
import { CheckCircle, XCircle, AlertCircle, Loader2, RefreshCw, Trash2 } from 'lucide-react';

export default function PWADebugPage() {
  const [status, setStatus] = useState({
    serviceWorker: null as string | null,
    permission: null as string | null,
    pushSubscription: null as string | null,
    caches: [] as string[],
    isInstallable: false,
    isInstalled: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const checkStatus = async () => {
    const newStatus = { ...status };

    // Check service worker
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        const reg = registrations[0];
        newStatus.serviceWorker = `Registered (${reg.scope})`;
        if (navigator.serviceWorker.controller) {
          newStatus.serviceWorker += ' - Controlling';
        } else {
          newStatus.serviceWorker += ' - Not controlling';
        }
      } else {
        newStatus.serviceWorker = null;
      }
    }

    // Check notification permission
    if ('Notification' in window) {
      newStatus.permission = Notification.permission;
    }

    // Check push subscription
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        newStatus.pushSubscription = subscription ? JSON.stringify(subscription.toJSON(), null, 2) : null;
      } catch (error) {
        console.error('Failed to check push subscription:', error);
      }
    }

    // Check caches
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      newStatus.caches = cacheNames;
    }

    // Check PWA install status
    newStatus.isInstallable = !!(window as any).deferredPrompt;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone || 
                        document.referrer.includes('android-app://');
    newStatus.isInstalled = isStandalone;

    setStatus(newStatus);
  };

  useEffect(() => {
    checkStatus();
    
    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Controller changed');
        checkStatus();
      });
    }

    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      console.log('beforeinstallprompt event');
      (window as any).deferredPrompt = e;
      checkStatus();
    });

    window.addEventListener('appinstalled', () => {
      console.log('App installed');
      checkStatus();
    });
  }, []);

  const handleServiceWorkerRegistration = async () => {
    setIsLoading(true);
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
          updateViaCache: 'none'
        });
        console.log('Service worker manually registered:', registration);
        
        toast({
          title: 'Service Worker Registered',
          description: 'The service worker has been registered successfully.',
        });
        
        await checkStatus();
        
        // Try to claim clients
        if (registration.active) {
          await registration.active.postMessage({ type: 'SKIP_WAITING' });
        }
      }
    } catch (error) {
      console.error('Manual service worker registration failed:', error);
      toast({
        title: 'Registration Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    try {
      // Unregister all service workers
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map(reg => reg.unregister()));
        console.log('All service workers unregistered');
      }

      // Clear all caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('All caches cleared');
      }

      // Clear localStorage and sessionStorage
      localStorage.clear();
      sessionStorage.clear();

      toast({
        title: 'Reset Complete',
        description: 'All service workers, caches, and storage have been cleared. Reloading...',
      });

      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error) {
      console.error('Reset failed:', error);
      toast({
        title: 'Reset Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstallPWA = async () => {
    const prompt = (window as any).deferredPrompt;
    if (!prompt) {
      toast({
        title: 'Not Installable',
        description: 'PWA is not installable at this time. Make sure you\'re using HTTPS and meet PWA criteria.',
        variant: 'destructive',
      });
      return;
    }

    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    console.log('Install prompt outcome:', outcome);
    
    if (outcome === 'accepted') {
      toast({
        title: 'Installation Started',
        description: 'The PWA is being installed...',
      });
    }
    
    (window as any).deferredPrompt = null;
    checkStatus();
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>PWA Debug Panel</CardTitle>
          <CardDescription>
            Comprehensive debugging tools for Progressive Web App features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Service Worker Status */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Service Worker</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {status.serviceWorker ? (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                  <span className="font-mono text-sm">
                    {status.serviceWorker || 'No service worker registered'}
                  </span>
                </div>
                {!status.serviceWorker && (
                  <Button
                    onClick={handleServiceWorkerRegistration}
                    size="sm"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Register'
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Notification Permission */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-3">
                {status.permission === 'granted' ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : status.permission === 'denied' ? (
                  <XCircle className="h-5 w-5 text-red-500" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                )}
                <span className="font-mono text-sm">
                  Permission: {status.permission || 'Not available'}
                </span>
              </div>
              {status.permission === 'default' && (
                <Button
                  onClick={() => Notification.requestPermission().then(checkStatus)}
                  size="sm"
                >
                  Request
                </Button>
              )}
            </div>
          </div>

          {/* Push Subscription */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Push Subscription</h3>
            <div className="bg-muted p-3 rounded-lg">
              <pre className="text-xs overflow-auto max-h-40">
                {status.pushSubscription || 'No push subscription'}
              </pre>
            </div>
          </div>

          {/* Caches */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Caches</h3>
            <div className="bg-muted p-3 rounded-lg">
              {status.caches.length > 0 ? (
                <ul className="text-sm space-y-1">
                  {status.caches.map((cache, i) => (
                    <li key={i} className="font-mono">{cache}</li>
                  ))}
                </ul>
              ) : (
                <span className="text-sm text-muted-foreground">No caches found</span>
              )}
            </div>
          </div>

          {/* PWA Install Status */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">PWA Installation</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <CheckCircle className={status.isInstalled ? "h-5 w-5 text-green-500" : "h-5 w-5 text-gray-400"} />
                <span className="font-mono text-sm">
                  Installed: {status.isInstalled ? 'Yes' : 'No'}
                </span>
              </div>
              {status.isInstallable && !status.isInstalled && (
                <Button onClick={handleInstallPWA} className="w-full">
                  Install PWA
                </Button>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-4 border-t">
            <Button onClick={checkStatus} variant="outline">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button onClick={handleClearAll} variant="destructive" disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              Clear Everything
            </Button>
          </div>

          {/* Instructions */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Quick Fixes:</strong>
              <ul className="mt-2 ml-4 list-disc text-sm space-y-1">
                <li>If service worker is not registering, try the "Clear Everything" button and reload</li>
                <li>Make sure you've restarted the dev server after next-pwa configuration changes</li>
                <li>Check browser console for detailed error messages</li>
                <li>On mobile, ensure you're using HTTPS (or localhost)</li>
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}