
'use client';

import { useEffect, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { usePathname } from 'next/navigation';
import { registerServiceWorker, OfflineStorage } from '@/lib/pwa-utils';
import { PWANavigation } from './pwa-navigation';
import { InstallBanner } from './install-banner';
import { OfflineIndicator } from './offline-indicator';

interface PWAWrapperProps {
  children: ReactNode;
}

const PWAWrapper: React.FC<PWAWrapperProps> = ({ children }) => {
  const { data: session } = useSession();
  const pathname = usePathname();

  useEffect(() => {
    // Register service worker
    if (typeof window !== 'undefined') {
      registerServiceWorker();
      
      // Initialize offline storage
      const storage = new OfflineStorage();
      storage.init().catch(console.error);
    }
  }, []);

  const isPWARoute = pathname.includes('/pwa/');

  return (
    <>
      {children}
      <OfflineIndicator />
      {session?.user && (
        <>
          <PWANavigation userRole={session.user.role} />
          {isPWARoute && <InstallBanner />}
        </>
      )}
    </>
  );
};

export default PWAWrapper;
