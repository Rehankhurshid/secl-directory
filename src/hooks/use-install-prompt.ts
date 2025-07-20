import { useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function useInstallPrompt() {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if iOS
    const checkIOS = () => {
      return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    };

    // Check if running in standalone mode
    const checkStandalone = () => {
      return (
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone === true
      );
    };

    const iOS = checkIOS();
    const standalone = checkStandalone();
    
    setIsIOS(iOS);
    setIsInstalled(standalone);

    // Don't show install prompt if already installed
    if (standalone) {
      return;
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Save the event so it can be triggered later
      setInstallPrompt(e as BeforeInstallPromptEvent);
      
      console.log('💾 PWA install prompt available');
      
      // Show prompt after 30 seconds or on user engagement
      setTimeout(() => {
        if (!localStorage.getItem('pwa-install-dismissed')) {
          setIsInstallable(true);
        }
      }, 30000);
    };

    const handleAppInstalled = () => {
      console.log('✅ PWA was installed');
      setIsInstalled(true);
      setInstallPrompt(null);
      setIsInstallable(false);
    };

    // Listen for the install prompt (Android/Chrome)
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Check if should show iOS instructions
    if (iOS && !standalone && !localStorage.getItem('ios-install-dismissed')) {
      setTimeout(() => {
        setIsInstallable(true);
      }, 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = async (): Promise<boolean> => {
    if (!installPrompt) {
      console.warn('⚠️ Install prompt not available');
      return false;
    }

    try {
      // Show the install prompt
      await installPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await installPrompt.userChoice;
      
      console.log(`👤 User choice: ${outcome}`);
      
      if (outcome === 'accepted') {
        setInstallPrompt(null);
        setIsInstallable(false);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error showing install prompt:', error);
      return false;
    }
  };

  const dismissPrompt = () => {
    setIsInstallable(false);
    setInstallPrompt(null);
  };

  return {
    isInstallable,
    isInstalled,
    isIOS,
    promptInstall,
    dismissPrompt
  };
} 