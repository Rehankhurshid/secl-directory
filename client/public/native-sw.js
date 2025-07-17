// Native Service Worker for Employee Directory Notifications
const CACHE_NAME = 'employee-directory-v4';
const urlsToCache = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Native service worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Native service worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // Claim all clients immediately
  self.clients.claim();
});

// Fetch event - serve from cache when offline
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.notification.tag);
  
  event.notification.close();
  
  // Get the data from the notification
  const notificationData = event.notification.data || {};
  const groupId = notificationData.groupId;
  const url = notificationData.url || '/';
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate to the specific group if groupId is provided
          if (groupId) {
            client.postMessage({
              type: 'navigate-to-group',
              groupId: groupId
            });
          }
          return client.focus();
        }
      }
      
      // If app is not open, open it with the specific URL
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// Handle notification actions (reply, view, etc.)
self.addEventListener('notificationclick', (event) => {
  const action = event.action;
  const notificationData = event.notification.data || {};
  
  if (action === 'reply') {
    // Handle reply action
    console.log('Reply action clicked');
    event.notification.close();
    
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].postMessage({
            type: 'reply-to-message',
            groupId: notificationData.groupId,
            messageId: notificationData.messageId
          });
          return clientList[0].focus();
        }
        return clients.openWindow(notificationData.url || '/');
      })
    );
  } else if (action === 'view') {
    // Handle view action
    console.log('View action clicked');
    event.notification.close();
    
    event.waitUntil(
      clients.matchAll().then((clientList) => {
        if (clientList.length > 0) {
          clientList[0].postMessage({
            type: 'view-message',
            groupId: notificationData.groupId
          });
          return clientList[0].focus();
        }
        return clients.openWindow(notificationData.url || '/');
      })
    );
  }
});

// Handle background sync for offline message sending
self.addEventListener('sync', (event) => {
  if (event.tag === 'send-message') {
    console.log('Background sync: send-message');
    // Handle offline message sending
    event.waitUntil(
      // Implementation for sending queued messages
      Promise.resolve()
    );
  }
});

// Handle push events (for future web push integration)
self.addEventListener('push', (event) => {
  console.log('Push event received');
  
  let notificationData = {
    title: 'New Message',
    body: 'You have a new message',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'employee-directory',
    data: {
      url: '/',
      timestamp: Date.now()
    }
  };
  
  if (event.data) {
    try {
      const pushData = event.data.json();
      notificationData = { ...notificationData, ...pushData };
    } catch (error) {
      console.error('Error parsing push data:', error);
      notificationData.body = event.data.text();
    }
  }
  
  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      tag: notificationData.tag,
      data: notificationData.data,
      requireInteraction: false,
      silent: false,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'view',
          title: 'View',
          icon: '/icon-192x192.png'
        },
        {
          action: 'reply',
          title: 'Reply',
          icon: '/icon-192x192.png'
        }
      ]
    })
  );
});

// Handle messages from the main thread
self.addEventListener('message', (event) => {
  console.log('SW received message:', event.data);
  
  if (event.data && event.data.type === 'clear-badge') {
    // Clear notification badge
    if (self.registration && self.registration.clearBadge) {
      self.registration.clearBadge();
    }
  }
  
  if (event.data && event.data.type === 'show-notification') {
    const { title, options } = event.data;
    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  }
});