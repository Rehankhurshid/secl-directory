// public/service-worker.js
// Import Workbox libraries
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js')

// Immediate claim
self.skipWaiting()
workbox.core.clientsClaim()

// Handle push events
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const { title, body, icon, badge, tag, data: notificationData } = data

  const options = {
    body,
    icon: icon || '/icons/icon-192x192.png',
    badge: badge || '/icons/badge-72x72.png',
    tag: tag || 'default',
    data: notificationData,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: 'view',
        title: 'View Message',
        icon: '/icons/view-icon.png',
      },
      {
        action: 'dismiss',
        title: 'Dismiss',
        icon: '/icons/dismiss-icon.png',
      },
    ],
  }

  event.waitUntil(
    self.registration.showNotification(title, options)
  )
})

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const { action, notification } = event
  const { data } = notification

  if (action === 'dismiss') {
    return
  }

  // Handle view action or notification body click
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if there's already a window open
      for (const client of clientList) {
        if (client.url.includes('/messages') && 'focus' in client) {
          return client.focus()
        }
      }

      // Open new window if needed
      if (clients.openWindow) {
        const url = data?.messageId 
          ? `/messages/${data.conversationId}?messageId=${data.messageId}`
          : '/messages'
        
        return clients.openWindow(url)
      }
    })
  )
})

// Background sync for messages
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-messages') {
    event.waitUntil(syncOfflineMessages())
  }
})

async function syncOfflineMessages() {
  try {
    // Open IndexedDB
    const db = await openDB('EmployeeMessagingDB', 1)
    const tx = db.transaction('messages', 'readwrite')
    const store = tx.objectStore('messages')
    const index = store.index('by-status')
    
    // Get pending messages
    const pendingMessages = await index.getAll('pending')
    
    for (const message of pendingMessages) {
      try {
        // Update status to sending
        message.status = 'sending'
        await store.put(message)
        
        // Send to server
        const response = await fetch('/api/messages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            conversationId: message.conversationId,
            recipientId: message.recipientId,
            content: message.content,
            type: message.type,
            attachments: message.attachments,
          }),
        })

        if (response.ok) {
          // Remove from queue on success
          await store.delete(message.id)
          
          // Notify clients of successful sync
          const clients = await self.clients.matchAll()
          clients.forEach(client => {
            client.postMessage({
              type: 'SYNC_SUCCESS',
              messageId: message.id,
            })
          })
        } else {
          throw new Error(`Failed to send: ${response.status}`)
        }
      } catch (error) {
        console.error('Failed to sync message:', error)
        
        // Update retry count
        message.retryCount = (message.retryCount || 0) + 1
        message.status = message.retryCount >= 3 ? 'failed' : 'pending'
        await store.put(message)
      }
    }
    
    await tx.complete
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Periodic background sync for employee data
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-employee-data') {
    event.waitUntil(syncEmployeeData())
  }
})

async function syncEmployeeData() {
  try {
    const response = await fetch('/api/employees/sync', {
      method: 'GET',
      headers: {
        'If-Modified-Since': await getLastSyncTime(),
      },
    })

    if (response.ok && response.status !== 304) {
      const employees = await response.json()
      
      // Update IndexedDB with fresh data
      const db = await openDB('EmployeeMessagingDB', 1)
      const tx = db.transaction('employees', 'readwrite')
      const store = tx.objectStore('employees')
      
      for (const employee of employees) {
        await store.put({
          ...employee,
          lastSyncedAt: new Date().toISOString(),
        })
      }
      
      await tx.complete
      
      // Update last sync time
      await setLastSyncTime(new Date().toISOString())
    }
  } catch (error) {
    console.error('Employee sync failed:', error)
  }
}

// Helper functions for IndexedDB
async function openDB(name, version) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

async function getLastSyncTime() {
  const cache = await caches.open('app-metadata')
  const response = await cache.match('/last-sync-time')
  return response ? await response.text() : ''
}

async function setLastSyncTime(time) {
  const cache = await caches.open('app-metadata')
  await cache.put(
    '/last-sync-time',
    new Response(time, {
      headers: { 'Content-Type': 'text/plain' },
    })
  )
}

// Handle fetch events for offline support
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Handle API requests differently
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request))
  }
})

async function handleApiRequest(request) {
  try {
    // Try network first
    const response = await fetch(request)
    
    // Cache successful responses
    if (response.ok && request.method === 'GET') {
      const cache = await caches.open('api-cache')
      cache.put(request, response.clone())
    }
    
    return response
  } catch (error) {
    // If offline, try cache
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request)
      
      if (cachedResponse) {
        // Add offline header
        const headers = new Headers(cachedResponse.headers)
        headers.set('X-From-Cache', 'true')
        headers.set('X-Cache-Time', cachedResponse.headers.get('date') || '')
        
        return new Response(cachedResponse.body, {
          status: cachedResponse.status,
          statusText: cachedResponse.statusText,
          headers: headers,
        })
      }
    }
    
    // Return offline error
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No internet connection',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}