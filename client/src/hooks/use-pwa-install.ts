import { useState, useEffect } from 'react';

interface PWAInstallHook {
  canInstall: boolean;
  showInstallDialog: boolean;
  setShowInstallDialog: (show: boolean) => void;
  promptInstall: () => Promise<void>;
  isInstalled: boolean;
  deviceType: 'ios' | 'android' | 'desktop' | 'unknown';
}

export function usePWAInstall(): PWAInstallHook {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);
  const [showInstallDialog, setShowInstallDialog] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [deviceType, setDeviceType] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');

  useEffect(() => {
    // Detect device type
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setDeviceType('ios');
    } else if (/android/.test(userAgent)) {
      setDeviceType('android');
    } else if (/windows|macintosh|linux/.test(userAgent)) {
      setDeviceType('desktop');
    }

    // Check if already installed
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    setIsInstalled(isStandalone);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Auto-show install dialog based on conditions (much less intrusive)
    const shouldShowInstallDialog = () => {
      const hasShownBefore = localStorage.getItem('pwa-install-dismissed');
      const lastShownDate = localStorage.getItem('pwa-install-last-shown');
      const visitCount = parseInt(localStorage.getItem('pwa-visit-count') || '0');
      
      // Update visit count
      localStorage.setItem('pwa-visit-count', String(visitCount + 1));
      
      // Only show if:
      // - Not installed
      // - User hasn't dismissed it permanently
      // - User has visited at least 5 times
      // - It's been at least 7 days since last shown (if ever shown)
      // - Can install automatically (browser supports it)
      const today = new Date().toDateString();
      const daysSinceLastShown = lastShownDate ? 
        Math.floor((Date.now() - new Date(lastShownDate).getTime()) / (1000 * 60 * 60 * 24)) : 999;
      
      // For development/testing, show less frequently
      const isDevelopment = import.meta.env.DEV;
      const minVisits = isDevelopment ? 10 : 5;
      const minDays = isDevelopment ? 1 : 7;
      
      if (!isStandalone && !hasShownBefore && visitCount >= minVisits && daysSinceLastShown >= minDays && canInstall) {
        setTimeout(() => {
          setShowInstallDialog(true);
          localStorage.setItem('pwa-install-last-shown', today);
        }, 5000); // Show after 5 seconds
      }
    };

    // Only auto-show on supported devices
    if (deviceType !== 'unknown') {
      shouldShowInstallDialog();
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [canInstall, deviceType]);

  const promptInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
        setShowInstallDialog(false);
      }
    }
  };

  // Custom dialog close handler
  const handleDialogClose = (dontShowAgain: boolean = false) => {
    if (dontShowAgain) {
      localStorage.setItem('pwa-install-dismissed', 'true');
    } else {
      // If user just closes it, don't show again for 3 days
      const threeDaysFromNow = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toDateString();
      localStorage.setItem('pwa-install-last-shown', threeDaysFromNow);
    }
    setShowInstallDialog(false);
  };

  return {
    canInstall,
    showInstallDialog,
    setShowInstallDialog: (show: boolean) => {
      if (!show) {
        handleDialogClose(false);
      } else {
        setShowInstallDialog(show);
      }
    },
    promptInstall,
    isInstalled,
    deviceType
  };
}