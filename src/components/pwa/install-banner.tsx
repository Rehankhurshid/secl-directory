"use client";

import { useInstallPrompt } from '@/hooks/use-install-prompt';
import { Button } from '@/components/ui/button';
import { Download, X, Smartphone } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

export function InstallBanner() {
  const { isInstallable, isIOS, promptInstall, dismissPrompt } = useInstallPrompt();

  if (!isInstallable) return null;

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      console.log('✅ PWA installed successfully');
    }
  };

  const handleDismiss = () => {
    dismissPrompt();
    localStorage.setItem(
      isIOS ? 'ios-install-dismissed' : 'pwa-install-dismissed',
      'true'
    );
  };

  return (
    <Card className="fixed bottom-4 left-4 right-4 z-50 shadow-lg border-2 border-primary/20 md:left-auto md:right-4 md:max-w-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
            {isIOS ? (
              <Smartphone className="h-5 w-5 text-primary" />
            ) : (
              <Download className="h-5 w-5 text-primary" />
            )}
          </div>
          
          <div className="flex-1 space-y-2">
            <div>
              <h3 className="text-sm font-semibold">Install SECL Messaging</h3>
              {isIOS ? (
                <p className="text-xs text-muted-foreground">
                  Tap the share button <span className="font-semibold">⎋</span> and select 
                  "Add to Home Screen" <span className="font-semibold">➕</span> for the best experience.
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Get the full app experience with offline support, push notifications, and faster loading.
                </p>
              )}
            </div>
            
            <div className="flex gap-2">
              {!isIOS && (
                <Button
                  onClick={handleInstall}
                  size="sm"
                  className="h-8 text-xs"
                >
                  Install App
                </Button>
              )}
              <Button
                onClick={handleDismiss}
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
              >
                Not now
              </Button>
            </div>
          </div>
          
          <Button
            onClick={handleDismiss}
            variant="ghost"
            size="sm"
            className="h-auto p-1 flex-shrink-0"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 