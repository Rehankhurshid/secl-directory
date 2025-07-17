const CACHE_NAME = 'secl-employee-directory-v7';
const ESSENTIAL_CACHE = [
  '/manifest.json',
  '/icon-192x192.svg',
  '/icon-512x512.svg'
];

// Install event - only cache essential assets
self.addEventListener('install', event => {
  console.log('Service Worker installing - no caching strategy');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Only caching essential assets');
        return cache.addAll(ESSENTIAL_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches and take control immediately
self.addEventListener('activate', event => {
  console.log('Service Worker activating - clearing old caches');
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated - claiming clients');
      return self.clients.claim();
    })
  );
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fetch event - network-first for everything except essential assets
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Always fetch API calls from network - let authentication headers through
  if (url.pathname.includes('/api/')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // For essential assets, use cache-first
  if (ESSENTIAL_CACHE.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          if (response) {
            return response;
          }
          return fetch(event.request)
            .then(response => {
              if (response.status === 200) {
                const responseToCache = response.clone();
                caches.open(CACHE_NAME)
                  .then(cache => cache.put(event.request, responseToCache));
              }
              return response;
            });
        })
    );
    return;
  }

  // For other resources - network first with cache fallback
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => cache.put(event.request, responseToCache));
        }
        return response;
      })
      .catch(() => {
        // Serve from cache if available
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            
            // Offline fallback for HTML pages only
            if (event.request.destination === 'document') {
              return new Response(`
                <!DOCTYPE html>
                <html>
                <head>
                  <title>Offline - Employee Directory</title>
                  <meta name="viewport" content="width=device-width, initial-scale=1">
                  <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .offline-message { color: #666; }
                  </style>
                </head>
                <body>
                  <h1>You're Offline</h1>
                  <p class="offline-message">Please check your internet connection and try again.</p>
                  <button onclick="window.location.reload()">Retry</button>
                </body>
                </html>
              `, {
                headers: { 'Content-Type': 'text/html' }
              });
            }
            return new Response('Network error occurred', {
              status: 408,
              statusText: 'Request Timeout'
            });
          });
      })
  );
});

// Handle push notifications with Android-specific fixes
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    
    // Android-specific notification options
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.svg',
      badge: data.badge || '/icon-192x192.svg',
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      vibrate: data.vibrate || [200, 100, 200],
      // Android-specific options
      timestamp: Date.now(),
      renotify: true,  // Allow re-notification for same tag
      sticky: false,   // Don't make notification sticky
      noscreen: false, // Show notification on lock screen
      dir: 'auto'      // Text direction
    };

    // Additional Android Chrome fixes
    if (data.image) {
      options.image = data.image;
    }
    
    // Ensure notification displays on Android
    event.waitUntil(
      self.registration.showNotification(data.title || 'SECL Notification', options)
        .catch(error => {
          console.error('Error showing notification:', error);
          // Fallback notification without advanced features
          return self.registration.showNotification(data.title || 'SECL Notification', {
            body: data.body,
            icon: '/icon-192x192.svg',
            badge: '/icon-192x192.svg',
            tag: 'fallback'
          });
        })
    );
  }
});

// Handle notification clicks with interactive preview
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const data = event.notification.data || {};
  
  if (event.action === 'view' || !event.action) {
    // Handle view action or default click - open messaging page
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        const url = data.url || '/messaging';
        
        // Check if the app is already open
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('/messaging') && 'focus' in client) {
            client.focus();
            // Send message data to the open window
            client.postMessage({
              type: 'notification-click',
              data: data
            });
            return;
          }
        }
        
        // Open new window if not already open
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  } else if (event.action === 'reply') {
    // Handle reply action - open messaging page focused on reply
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then(clientList => {
        const url = data.url || '/messaging';
        
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url.includes('/messaging') && 'focus' in client) {
            client.focus();
            // Send reply action to the open window
            client.postMessage({
              type: 'notification-reply',
              data: data
            });
            return;
          }
        }
        
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
      })
    );
  }
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(
      // Handle background sync logic
      console.log('Background sync triggered')
    );
  }
});

// Clean up duplicate handlers - already handled above
