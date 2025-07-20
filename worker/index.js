// Custom service worker code for push notifications
// This will be merged with next-pwa's generated service worker

self.addEventListener('push', (event) => {
  console.log('Push notification received');

  if (!event.data) {
    console.warn('Push notification received but no data');
    return;
  }

  let notificationData;
  try {
    notificationData = event.data.json();
  } catch (e) {
    notificationData = {
      title: 'New Message',
      body: event.data.text(),
    };
  }

  const options = {
    body: notificationData.body || 'You have a new message',
    icon: notificationData.icon || '/icon-192x192.png',
    badge: notificationData.badge || '/icon-72x72.png',
    vibrate: notificationData.vibrate || [100, 50, 100],
    data: notificationData.data || {},
    tag: notificationData.tag || 'default',
    requireInteraction: notificationData.requireInteraction || false,
    renotify: notificationData.renotify || false,
    silent: notificationData.silent || false,
    actions: notificationData.actions || [
      {
        action: 'view',
        title: 'View',
      },
      {
        action: 'close',
        title: 'Close',
      }
    ],
  };

  event.waitUntil(
    self.registration.showNotification(
      notificationData.title || 'SECL Directory',
      options
    )
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event.action);
  event.notification.close();

  // Handle different actions
  if (event.action === 'close') {
    return;
  }

  // Default action - open the app
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.registration.scope) && 'focus' in client) {
            return client.focus();
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          const urlToOpen = event.notification.data?.url || '/';
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed', event.notification.tag);
  // You can track notification dismissals here
});

// Handle background sync for offline message queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'send-messages') {
    event.waitUntil(sendQueuedMessages());
  }
});

async function sendQueuedMessages() {
  // Implementation for sending queued messages when back online
  console.log('Syncing queued messages...');
  
  // Open IndexedDB and get queued messages
  const db = await openDB();
  const tx = db.transaction('queued-messages', 'readonly');
  const messages = await tx.objectStore('queued-messages').getAll();
  
  for (const message of messages) {
    try {
      // Send message to server
      const response = await fetch('/api/messages/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${message.token}`,
        },
        body: JSON.stringify({
          groupId: message.groupId,
          content: message.content,
        }),
      });
      
      if (response.ok) {
        // Remove message from queue
        const deleteTx = db.transaction('queued-messages', 'readwrite');
        await deleteTx.objectStore('queued-messages').delete(message.id);
      }
    } catch (error) {
      console.error('Failed to send queued message:', error);
    }
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('secl-directory', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}