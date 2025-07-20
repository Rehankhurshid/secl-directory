// components/ServiceWorkerRegistration.tsx
'use client'

import { useEffect } from 'react'
import { Workbox } from 'workbox-window'

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      window.workbox !== undefined
    ) {
      const wb = new Workbox('/sw.js')
      
      // Add event listeners to handle service worker lifecycle events
      wb.addEventListener('installed', (event) => {
        console.log('Service worker installed:', event)
      })

      wb.addEventListener('waiting', () => {
        // Show update prompt to user
        if (
          window.confirm(
            'A new version of the app is available. Would you like to update?'
          )
        ) {
          wb.addEventListener('controlling', () => {
            window.location.reload()
          })
          
          // Send skip waiting message to service worker
          wb.messageSkipWaiting()
        }
      })

      wb.addEventListener('activated', (event) => {
        console.log('Service worker activated:', event)
      })

      wb.addEventListener('message', (event) => {
        console.log('Service worker message:', event.data)
      })

      // Register the service worker
      wb.register()
        .then((registration) => {
          console.log('Service worker registered:', registration)
          
          // Check for updates every hour
          setInterval(() => {
            wb.update()
          }, 1000 * 60 * 60)
        })
        .catch((error) => {
          console.error('Service worker registration failed:', error)
        })
    }
  }, [])

  return null
}