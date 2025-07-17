import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X, Share, Plus, MoreVertical, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface PWAInstallDialogProps {
  open: boolean;
  onClose: () => void;
}

type DeviceType = 'ios' | 'android' | 'desktop' | 'unknown';

const detectDevice = (): DeviceType => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/iphone|ipad|ipod/.test(userAgent)) {
    return 'ios';
  } else if (/android/.test(userAgent)) {
    return 'android';
  } else if (/windows|macintosh|linux/.test(userAgent)) {
    return 'desktop';
  }
  
  return 'unknown';
};

const isStandalone = (): boolean => {
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true;
};

export function PWAInstallDialog({ open, onClose }: PWAInstallDialogProps) {
  const [deviceType, setDeviceType] = useState<DeviceType>('unknown');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    setDeviceType(detectDevice());

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setCanInstall(false);
        onClose();
      }
    }
  };

  const renderIOSInstructions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-blue-600 border-blue-600">
          iOS Safari
        </Badge>
      </div>
      
      <div className="space-y-3 text-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs">
            1
          </div>
          <div>
            <p className="font-medium">Tap the Share button</p>
            <p className="text-muted-foreground">Look for the <Share className="inline w-4 h-4 mx-1" /> icon at the bottom of your screen</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs">
            2
          </div>
          <div>
            <p className="font-medium">Find "Add to Home Screen"</p>
            <p className="text-muted-foreground">Scroll down and tap <Plus className="inline w-4 h-4 mx-1" /> "Add to Home Screen"</p>
          </div>
        </div>
        
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 font-semibold text-xs">
            3
          </div>
          <div>
            <p className="font-medium">Confirm installation</p>
            <p className="text-muted-foreground">Tap "Add" to install the app to your home screen</p>
          </div>
        </div>
      </div>
      
      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Note:</strong> This only works in Safari browser. If you're using Chrome or other browsers, please open this page in Safari first.
        </p>
      </div>
    </div>
  );

  const renderAndroidInstructions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-green-600 border-green-600">
          Android Chrome
        </Badge>
      </div>
      
      {canInstall ? (
        <div className="space-y-3">
          <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
            <p className="text-sm text-green-800 dark:text-green-200 mb-3">
              Great! Your browser supports automatic installation.
            </p>
            <Button 
              onClick={handleInstallClick}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App Now
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-semibold text-xs">
              1
            </div>
            <div>
              <p className="font-medium">Open browser menu</p>
              <p className="text-muted-foreground">Tap the <MoreVertical className="inline w-4 h-4 mx-1" /> menu button in Chrome</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-semibold text-xs">
              2
            </div>
            <div>
              <p className="font-medium">Select "Add to Home screen"</p>
              <p className="text-muted-foreground">Look for the option in the dropdown menu</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center text-green-600 dark:text-green-400 font-semibold text-xs">
              3
            </div>
            <div>
              <p className="font-medium">Confirm installation</p>
              <p className="text-muted-foreground">Tap "Add" to install the app</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
        <p className="text-sm text-green-800 dark:text-green-200">
          <strong>Tip:</strong> You can also look for an install banner that might appear automatically at the bottom of your screen.
        </p>
      </div>
    </div>
  );

  const renderDesktopInstructions = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="outline" className="text-purple-600 border-purple-600">
          Desktop
        </Badge>
      </div>
      
      {canInstall ? (
        <div className="space-y-3">
          <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
            <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
              Install this app for quick access from your desktop.
            </p>
            <Button 
              onClick={handleInstallClick}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              <Download className="w-4 h-4 mr-2" />
              Install App
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3 text-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold text-xs">
              1
            </div>
            <div>
              <p className="font-medium">Look for install icon</p>
              <p className="text-muted-foreground">Check the address bar for an install icon or "+" button</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-6 h-6 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center text-purple-600 dark:text-purple-400 font-semibold text-xs">
              2
            </div>
            <div>
              <p className="font-medium">Alternative: Browser menu</p>
              <p className="text-muted-foreground">Open browser menu and look for "Install" or "Add to desktop" option</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderFallbackInstructions = () => (
    <div className="space-y-4">
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          To install this app, please use a supported browser:
        </p>
        <ul className="mt-2 text-sm text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>iOS:</strong> Safari browser</li>
          <li>• <strong>Android:</strong> Chrome browser</li>
          <li>• <strong>Desktop:</strong> Chrome, Edge, or Firefox</li>
        </ul>
      </div>
    </div>
  );

  // Don't show if already installed
  if (isStandalone()) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              Install SECL Directory
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <DialogDescription>
            Install this app on your device for quick access and offline functionality.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {deviceType === 'ios' && renderIOSInstructions()}
          {deviceType === 'android' && renderAndroidInstructions()}
          {deviceType === 'desktop' && renderDesktopInstructions()}
          {deviceType === 'unknown' && renderFallbackInstructions()}
          
          <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
              Why install?
            </h4>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Works offline when no internet connection</li>
              <li>• Faster loading and better performance</li>
              <li>• Native app-like experience</li>
              <li>• Quick access from your home screen</li>
            </ul>
          </div>
          
          <div className="flex flex-col gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} className="flex-1">
                Maybe Later
              </Button>
              <Button 
                onClick={() => {
                  localStorage.setItem('pwa-install-dismissed', 'true');
                  onClose();
                }} 
                variant="ghost"
                className="flex-1 text-muted-foreground"
              >
                Don't Show Again
              </Button>
            </div>
            <p className="text-xs text-muted-foreground text-center">
              You can still install manually from the profile menu → "Install App"
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}