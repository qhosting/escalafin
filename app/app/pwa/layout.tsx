'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { BottomNavBar } from '@/components/pwa/bottom-nav-bar';
import { ModeToggle } from '@/components/pwa/mode-toggle';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';
import { GenericSpinner } from '@/components/layout/loading-variants';

export default function PWALayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  if (status === 'loading') {
    return <GenericSpinner />;
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      <OfflineIndicator />
      {/* Main content area with bottom padding for nav bar */}
      <main className="flex-1 pb-20 overflow-auto">
        {children}
      </main>
      <BottomNavBar />
      <ModeToggle />
    </div>
  );
}
