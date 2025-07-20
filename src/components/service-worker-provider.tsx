'use client';

import { useEffect } from 'react';

declare global {
  interface Window {
    deferredPrompt: any;
  }
}

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handle PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      // Prevent Chrome 67 and earlier from automatically showing the prompt
      e.preventDefault();
      // Stash the event so it can be triggered later
      window.deferredPrompt = e;
      console.log('Install prompt captured and stored');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is installed
    window.addEventListener('appinstalled', () => {
      console.log('PWA was installed');
      window.deferredPrompt = null;
    });

    // next-pwa will handle service worker registration
    // Just log when it's ready
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then(() => {
        console.log('Service Worker is ready (registered by next-pwa)');
        if (navigator.serviceWorker.controller) {
          console.log('Page is controlled by Service Worker');
        } else {
          console.log('Page is NOT controlled by Service Worker (first visit or hard refresh)');
        }
      });
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  return <>{children}</>;
}