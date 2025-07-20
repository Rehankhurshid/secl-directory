// app/offline/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { WifiOff, RefreshCw, Users, MessageSquare } from 'lucide-react'

export default function OfflinePage() {
  const [isOnline, setIsOnline] = useState(false)
  const [cachedEmployees, setCachedEmployees] = useState<number>(0)
  const [cachedMessages, setCachedMessages] = useState<number>(0)

  useEffect(() => {
    // Check online status
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine)
    }

    // Get cached data count
    const getCachedData = async () => {
      if ('caches' in window) {
        try {
          const employeeCache = await caches.open('employee-data')
          const messageCache = await caches.open('messages-cache')
          
          const employeeKeys = await employeeCache.keys()
          const messageKeys = await messageCache.keys()
          
          setCachedEmployees(employeeKeys.length)
          setCachedMessages(messageKeys.length)
        } catch (error) {
          console.error('Error accessing cache:', error)
        }
      }
    }

    updateOnlineStatus()
    getCachedData()

    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  const handleRefresh = () => {
    window.location.reload()
  }

  if (isOnline) {
    // Redirect to home if online
    window.location.href = '/'
    return null
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <div className="mx-auto h-24 w-24 bg-gray-200 rounded-full flex items-center justify-center">
            <WifiOff className="h-12 w-12 text-gray-600" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">
            You're Offline
          </h1>
          
          <p className="text-gray-600">
            Don't worry! You can still access cached employee data and messages.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Available Offline Content
          </h2>
          
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <Users className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium">Cached Employees</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {cachedEmployees}
              </span>
            </div>
            
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium">Cached Messages</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">
                {cachedMessages}
              </span>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <RefreshCw className="h-5 w-5 mr-2" />
            Try Again
          </button>
          
          <button
            onClick={() => window.history.back()}
            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Go Back
          </button>
        </div>

        <div className="text-sm text-gray-500">
          <p>
            Your messages will be sent automatically when you're back online.
          </p>
        </div>
      </div>
    </div>
  )
}