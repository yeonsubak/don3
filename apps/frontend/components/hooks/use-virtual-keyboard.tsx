import { useEffect, useState } from 'react';

export function useVirtualKeyboard(): boolean {
  const [keyboardOpen, setKeyboardOpen] = useState(false);

  useEffect(() => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const threshold = 100; // px

    const handleResize = () => {
      const heightDiff = window.innerHeight - viewport.height;
      setKeyboardOpen(heightDiff > threshold);
    };

    viewport.addEventListener('resize', handleResize);

    // Initial check in case keyboard is already open
    handleResize();

    return () => {
      viewport.removeEventListener('resize', handleResize);
    };
  }, []);

  return keyboardOpen;
}
