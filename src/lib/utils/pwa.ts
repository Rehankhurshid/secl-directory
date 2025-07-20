// Extend Window interface to include deferredPrompt
declare global {
  interface Window {
    deferredPrompt: any;
  }
}

export async function installPWA() {
  if (!window.deferredPrompt) {
    throw new Error('App cannot be installed at this time');
  }

  const deferredPrompt = window.deferredPrompt;
  deferredPrompt.prompt();
  
  const { outcome } = await deferredPrompt.userChoice;
  
  if (outcome === 'accepted') {
    window.deferredPrompt = null;
  }
  
  return outcome === 'accepted';
}