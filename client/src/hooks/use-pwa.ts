import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

// Platform detection functions
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
}

export function isAndroid() {
  return /Android/.test(navigator.userAgent);
}

export function isInStandaloneMode() {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
}

export function usePWA() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect platform
    if (isIOS()) {
      setPlatform('ios');
      // For iOS, check if can be installed (not already in standalone mode)
      if (!isInStandaloneMode()) {
        setIsInstallable(true);
      }
    } else if (isAndroid()) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Check if already installed
    if (isInStandaloneMode()) {
      setIsInstalled(true);
      setIsInstallable(false);
    }

    // Register minimal service worker for notifications only
    if ('serviceWorker' in navigator) {
      // First unregister the problematic main service worker
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          if (registration.scope.includes('sw.js')) {
            registration.unregister();
          }
        });
      });
      
      // Register the native service worker for notifications
      navigator.serviceWorker.register('/native-sw.js').then(registration => {
        console.log('Native SW registered for notifications:', registration);
      }).catch(error => {
        console.error('Native SW registration failed:', error);
      });
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt as EventListener);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const getInstallInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: 'Install on iPhone/iPad',
          steps: [
            'Tap the Share button (⬆️) in Safari',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to confirm installation'
          ],
          icon: '📱'
        };
      case 'android':
        return {
          title: 'Install on Android',
          steps: [
            'Tap the menu (⋮) in Chrome',
            'Select "Add to Home screen"',
            'Tap "Add" to confirm installation'
          ],
          icon: '🤖'
        };
      default:
        return {
          title: 'Install on Desktop',
          steps: [
            'Look for the install icon (⊞) in your browser\'s address bar',
            'Click it and select "Install"',
            'The app will open in its own window'
          ],
          icon: '💻'
        };
    }
  };

  const installApp = async () => {
    if (deferredPrompt) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        
        if (outcome === 'accepted') {
          setIsInstallable(false);
          setDeferredPrompt(null);
        }
      } catch (error) {
        console.error('Install prompt failed:', error);
      }
    } else {
      // Enhanced mobile/desktop installation guidance
      const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const isAndroidDevice = /Android/.test(navigator.userAgent);
      const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches;
      
      if (isInStandaloneMode) {
        alert('SECL Directory is already installed on this device!');
        return;
      }
      
      if (isIOSDevice) {
        alert('📱 Install SECL Directory on iOS:\n\n1. Open this page in Safari\n2. Tap the Share button (📤)\n3. Scroll down and tap "Add to Home Screen"\n4. Tap "Add" to confirm\n\n✅ The app will appear on your home screen like a native app with offline access and push notifications!');
      } else if (isAndroidDevice) {
        alert('📱 Install SECL Directory on Android:\n\n1. Open this page in Chrome\n2. Tap the menu (⋮) in the top right\n3. Select "Add to Home Screen"\n4. Tap "Add" to confirm\n\n✅ The app will appear on your home screen with full native functionality!');
      } else {
        alert('💻 Install SECL Directory on Desktop:\n\n1. Open this page in Chrome or Edge\n2. Look for the install button (⊕) in the address bar\n3. Or use the browser menu → "Install SECL Directory"\n4. Click "Install" to confirm\n\n✅ The app will be available in your applications like a desktop program!');
      }
    }
  };

  const applyUpdate = async () => {
    console.log('Applying update and reloading...');
    window.location.reload();
  };

  const hardRefresh = async () => {
    // Clear all caches via service worker first
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_ALL_CACHES' });
      
      // Wait for cache clear confirmation
      await new Promise(resolve => {
        const messageHandler = (event: MessageEvent) => {
          if (event.data && event.data.type === 'CACHE_CLEARED') {
            navigator.serviceWorker.removeEventListener('message', messageHandler);
            resolve(true);
          }
        };
        navigator.serviceWorker.addEventListener('message', messageHandler);
        // Timeout after 2 seconds
        setTimeout(() => resolve(true), 2000);
      });
    }
    
    // Clear all caches from main thread too
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)));
    }
    
    // Clear localStorage (but preserve theme preference)
    const theme = localStorage.getItem('vite-ui-theme');
    localStorage.clear();
    if (theme) {
      localStorage.setItem('vite-ui-theme', theme);
    }
    
    // Clear sessionStorage
    sessionStorage.clear();
    
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map(registration => registration.unregister()));
    }
    
    // Force reload with cache bypass
    window.location.reload();
  };

  return {
    isInstallable,
    isInstalled,
    isOnline,
    updateAvailable,
    installApp,
    applyUpdate,
    hardRefresh,
    platform,
    getInstallInstructions
  };
}
