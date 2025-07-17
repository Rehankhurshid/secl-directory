import { useState, useEffect } from 'react';

export function useDeviceType() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkDevice = () => {
      // Check both screen size and user agent for mobile detection
      const screenWidth = window.innerWidth;
      const userAgent = navigator.userAgent;
      
      const isMobileScreen = screenWidth < 768; // Tailwind's md breakpoint
      const isMobileUserAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
      
      setIsMobile(isMobileScreen || isMobileUserAgent);
    };

    // Check on mount
    checkDevice();

    // Check on resize
    window.addEventListener('resize', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, []);

  return { isMobile };
}