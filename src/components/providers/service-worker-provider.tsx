'use client';

import { useEffect, useRef } from 'react';

export function ServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const initRef = useRef(false);

  useEffect(() => {
    // Prevent double initialization in development
    if (initRef.current) return;
    initRef.current = true;

    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      initializeServiceWorker();
    }
  }, []);

  return <>{children}</>;
}

async function initializeServiceWorker() {
  try {
    console.log('🔧 Initializing Service Worker...');
    
    // Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    });
    
    console.log('✅ Service Worker registered successfully:', registration);

    // Handle service worker updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        console.log('🔄 New Service Worker installing...');
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✨ New Service Worker installed! Refresh to use new version.');
          }
        });
      }
    });

    // Listen for messages from service worker
    navigator.serviceWorker.addEventListener('message', (event) => {
      console.log('📨 Message from Service Worker:', event.data);
    });

    console.log('🎉 Service Worker setup complete!');
    
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error);
  }
}