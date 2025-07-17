import { useEffect, useRef, useState } from 'react';

interface UseIntersectionObserverOptions extends IntersectionObserverInit {
  freezeOnceVisible?: boolean;
}

export function useIntersectionObserver(
  options: UseIntersectionObserverOptions = {}
) {
  const { freezeOnceVisible = false, ...observerOptions } = options;
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      const isElementIntersecting = entry.isIntersecting;
      
      if (isElementIntersecting) {
        setHasIntersected(true);
      }

      if (!freezeOnceVisible || !hasIntersected) {
        setIsIntersecting(isElementIntersecting);
      }
    }, observerOptions);

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [freezeOnceVisible, hasIntersected, observerOptions]);

  return { elementRef, isIntersecting, hasIntersected };
}