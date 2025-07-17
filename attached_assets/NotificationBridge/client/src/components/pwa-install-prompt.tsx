import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { usePWA } from '@/hooks/use-pwa';
import { toast } from 'react-toastify';

export function PWAInstallPrompt() {
  const { canInstall, promptInstall, dismissInstallPrompt } = usePWA();

  if (!canInstall) return null;

  const handleInstall = async () => {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      toast.success('App installed successfully!');
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm">
      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800">Install App</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={dismissInstallPrompt}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            Install this app on your device for a better experience!
          </p>
          <div className="flex gap-2">
            <Button onClick={handleInstall} className="bg-blue-600 hover:bg-blue-700">
              Install
            </Button>
            <Button variant="secondary" onClick={dismissInstallPrompt}>
              Later
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
