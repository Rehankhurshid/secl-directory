const CACHE_NAME = 'secl-employee-directory-v13';
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
      // Don't auto-skip waiting to prevent refresh loops
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
      console.log('Service Worker activated');
      // Don't auto-claim clients to prevent refresh loops
    })
  );
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_ALL_CACHES') {
    event.waitUntil(
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log('Force deleting cache:', cacheName);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        return self.clients.matchAll();
      }).then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'CACHE_CLEARED' });
        });
      })
    );
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

// Push notification handlers
self.addEventListener('push', (event) => {
  console.log('Service Worker: push event received');
  
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
      console.log('Service Worker: push data:', data);
    } catch (error) {
      console.error('Service Worker: invalid push payload:', error);
      // Still show a notification even if parsing fails
      data = { title: 'Employee Directory', body: 'New notification' };
    }
  }
  
  const title = data.title || 'Employee Directory';
  const options = {
    body: data.body || 'New message received',
    icon: data.icon || '/icon-192x192.png',
    badge: data.badge || '/icon-192x192.png',
    image: data.image,
    data: data.data || {},
    actions: data.actions || [],
    tag: data.tag || 'default',
    renotify: data.renotify !== false, // Default to true for Android
    requireInteraction: data.requireInteraction || false,
    silent: data.silent || false,
    timestamp: data.timestamp || Date.now(),
    vibrate: data.vibrate || [200, 100, 200],
    // Android-specific options
    dir: 'auto',
    lang: 'en-US'
  };
  
  console.log('Service Worker: showing notification with options:', options);
  
  event.waitUntil(
    self.registration.showNotification(title, options)
      .then(() => {
        console.log('Service Worker: notification shown successfully');
        // Update badge count if supported
        if ('setAppBadge' in navigator) {
          navigator.setAppBadge();
        }
      })
      .catch((error) => {
        console.error('Service Worker: error showing notification:', error);
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: notification click event');
  
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      
      // If app is not open, open it
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Service Worker: notification close event');
  
  // Track notification close if needed
  if (event.notification.data?.type === 'group_message') {
    // Could send analytics or track user engagement
    console.log('Group message notification closed');
  }
});