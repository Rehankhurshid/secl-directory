importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.23.0/firebase-messaging-compat.js');

// Initialize Firebase in service worker
const firebaseConfig = {
  apiKey: 'AIzaSyCkws6mLQwypnSZmkREy92vsp00YKVdKLs',
  authDomain: 'project-list-5aead.firebaseapp.com',
  projectId: 'project-list-5aead',
  storageBucket: 'project-list-5aead.appspot.com',
  messagingSenderId: '107892075896',
  appId: '1:107892075896:web:47fdbfe78953ab8d222c8d'
};

firebase.initializeApp(firebaseConfig);

// Get messaging service
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  // Check if it's a group message notification
  const isGroupMessage = payload.data?.type === 'group_message';
  const groupId = payload.data?.groupId;
  
  const notificationTitle = payload.notification?.title || 'Employee Directory';
  const notificationOptions = {
    body: payload.notification?.body || 'New notification',
    icon: payload.notification?.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: isGroupMessage && groupId ? `group-message-${groupId}` : 'employee-directory',
    data: payload.data || {},
    requireInteraction: isGroupMessage,
    actions: isGroupMessage ? [
      { action: 'view', title: 'View Message' },
      { action: 'dismiss', title: 'Dismiss' }
    ] : [],
    vibrate: [200, 100, 200],
    renotify: true
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[firebase-messaging-sw.js] Notification click received.');
  
  event.notification.close();
  
  // Handle notification action buttons
  if (event.action === 'dismiss') {
    return; // Just close the notification
  }
  
  // Determine the URL to open based on notification type
  let urlToOpen = '/';
  if (event.notification.data?.type === 'group_message' && event.notification.data?.groupId) {
    urlToOpen = `/groups?groupId=${event.notification.data.groupId}`;
  } else if (event.notification.data?.url) {
    urlToOpen = event.notification.data.url;
  }
  
  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          // Navigate to the specific URL if app is open
          client.postMessage({
            type: 'navigate',
            url: urlToOpen
          });
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