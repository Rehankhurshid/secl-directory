import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, X, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function PWAUpdatePrompt() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Temporarily disable automatic update detection to prevent persistent banner
    // TODO: Implement proper update detection logic without false positives
    return;
    
    // Check for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setUpdateAvailable(true);
      });

      // Check for waiting service worker
      navigator.serviceWorker.ready.then(registration => {
        if (registration.waiting) {
          setUpdateAvailable(true);
        }
      });
    }
  }, []);

  const handleUpdate = async () => {
    if (!('serviceWorker' in navigator)) return;

    setIsUpdating(true);
    
    try {
      const registration = await navigator.serviceWorker.ready;
      
      if (registration.waiting) {
        // Tell the waiting service worker to skip waiting
        registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      
      // Force refresh the page
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Update failed:', error);
      toast({
        title: "Update Failed",
        description: "Please try refreshing the page manually.",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleHardRefresh = () => {
    // Clear all caches and reload
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // Clear localStorage except for theme and important settings
    const preserveKeys = ['theme', 'pwa-install-dismissed'];
    const keysToRemove = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && !preserveKeys.includes(key)) {
        keysToRemove.push(key);
      }
    }
    
    keysToRemove.forEach(key => localStorage.removeItem(key));
    
    // Hard refresh
    window.location.reload();
  };

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 md:max-w-sm md:left-auto md:right-4">
      <div className="bg-card border rounded-lg shadow-xl p-4 border-blue-500/20">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <RefreshCw className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-sm">Update Available</h3>
              <Badge variant="default" className="text-xs bg-blue-500">
                New
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mb-3">
              A new version of the app is available with improvements and bug fixes
            </p>
            
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={handleUpdate}
                disabled={isUpdating}
                className="flex-1"
              >
                {isUpdating ? (
                  <RefreshCw className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Download className="w-4 h-4 mr-1" />
                )}
                {isUpdating ? "Updating..." : "Update Now"}
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleHardRefresh}
                className="flex-1"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Hard Refresh
              </Button>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setUpdateAvailable(false)}
                className="px-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}