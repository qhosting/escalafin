'use client';

import { useState, useEffect } from 'react';
import { NetworkDetector } from '@/lib/pwa-utils';

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const detector = new NetworkDetector();
    setIsOnline(detector.isNetworkOnline());

    detector.onNetworkChange((online) => {
      setIsOnline(online);
    });
  }, []);

  return isOnline;
}
