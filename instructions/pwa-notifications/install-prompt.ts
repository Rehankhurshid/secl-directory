// components/InstallPrompt.tsx
'use client'

import { useEffect, useState } from 'react'
import { X, Download, Smartphone } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode
    const checkStandalone = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      )
    }

    setIsStandalone(checkStandalone())

    // Check if iOS
    const checkIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
    }

    setIsIOS(checkIOS())

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      
      // Show prompt after 30 seconds or on user engagement
      setTimeout(() => {
        if (!localStorage.getItem('pwa-install-dismissed')) {
          setShowPrompt(true)
        }
      }, 30000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if should show iOS instructions
    if (checkIOS() && !checkStandalone() && !localStorage.getItem('ios-install-dismissed')) {
      setTimeout(() => {
        setShowPrompt(true)
      }, 5000)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt')
    } else {
      console.log('User dismissed the install prompt')
    }

    setDeferredPrompt(null)
    setShowPrompt(false)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem(
      isIOS ? 'ios-install-dismissed' : 'pwa-install-dismissed',
      'true'
    )
  }

  if (!showPrompt || isStandalone) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-white shadow-lg border-t z-50">
      <div className="max-w-md mx-auto">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Smartphone className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">
                Install Employee Connect
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                {isIOS
                  ? 'Tap the share button and then "Add to Home Screen" to install this app.'
                  : 'Install our app for quick access and offline features.'}
              </p>
            </div>
          </div>
          
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 ml-4 text-gray-400 hover:text-gray-500"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {!isIOS && deferredPrompt && (
          <div className="mt-4">
            <button
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Install Now
            </button>
          </div>
        )}
        
        {isIOS && (
          <div className="mt-4 text-xs text-gray-500">
            <p>
              1. Tap the <span className="font-semibold">Share</span> button in Safari
            </p>
            <p>
              2. Scroll down and tap <span className="font-semibold">Add to Home Screen</span>
            </p>
          </div>
        )}
      </div>
    </div>
  )
}