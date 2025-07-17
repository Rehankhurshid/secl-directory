import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show install banner
      setShowInstallBanner(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      console.log('App is already installed');
      setShowInstallBanner(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferred prompt
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismiss = () => {
    setShowInstallBanner(false);
    // Store dismissal in localStorage to not show again for some time
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
  };

  // Check if banner was recently dismissed
  useEffect(() => {
    const dismissedTime = localStorage.getItem('pwa-install-dismissed');
    if (dismissedTime) {
      const daysSinceDismissed = (Date.now() - parseInt(dismissedTime)) / (1000 * 60 * 60 * 24);
      if (daysSinceDismissed < 7) {
        setShowInstallBanner(false);
      }
    }
  }, []);

  if (!showInstallBanner || !deferredPrompt) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 p-4 bg-primary text-primary-foreground shadow-lg z-50 md:bottom-4 md:left-4 md:right-auto md:max-w-sm md:rounded-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-semibold mb-1">Install Employee Directory</h3>
          <p className="text-sm opacity-90">
            Install our app for a better experience with offline access and push notifications.
          </p>
        </div>
        <button
          onClick={handleDismiss}
          className="text-primary-foreground/70 hover:text-primary-foreground"
          aria-label="Dismiss"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <div className="flex gap-2 mt-3">
        <Button
          onClick={handleInstallClick}
          variant="secondary"
          size="sm"
          className="flex-1"
        >
          Install App
        </Button>
        <Button
          onClick={handleDismiss}
          variant="ghost"
          size="sm"
          className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
        >
          Not Now
        </Button>
      </div>
    </div>
  );
}