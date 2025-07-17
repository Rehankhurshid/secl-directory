const CACHE_NAME = 'pwa-notify-v1';
const urlsToCache = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(urlsToCache);
      })
  );
});

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

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll().then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});

self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from PWA!',
    icon: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODggNDg4Ij48cmVjdCB3aWR0aD0iNDg4IiBoZWlnaHQ9IjQ4OCIgZmlsbD0iIzE5NzZEMiIvPjx0ZXh0IHg9IjI0NCIgeT0iMjQ0IiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNzBweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tk9USUZZVEVNUE88L3RleHQ+PC9zdmc+',
    badge: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0ODggNDg4Ij48cmVjdCB3aWR0aD0iNDg4IiBoZWlnaHQ9IjQ4OCIgZmlsbD0iIzE5NzZEMiIvPjx0ZXh0IHg9IjI0NCIgeT0iMjQ0IiBmaWxsPSIjZmZmIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iNzBweCIgdGV4dC1hbmNob3I9Im1pZGRsZSI+Tk9USUZZVEVNUE88L3RleHQ+PC9zdmc+',
    tag: 'pwa-demo',
    requireInteraction: false,
    silent: false,
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: '/'
    }
  };

  event.waitUntil(
    self.registration.showNotification('PWA Notification', options)
  );
});
