'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DesktopNavbar } from './desktop-navbar';
import { MobileSidebar } from './mobile-sidebar';
import { BottomNavbar } from './bottom-navbar';
import { OfflineBanner } from '@/components/pwa/offline-banner';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

const NO_LAYOUT_PATHS = ['/auth/login', '/auth/register', '/auth/register-tenant', '/auth/forgot-password'];

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession() || {};
  const [mounted, setMounted] = React.useState(false);
  const isMobile = useIsMobile();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // No mostrar layout en páginas de autenticación o landing
  if (NO_LAYOUT_PATHS.includes(pathname) || pathname === '/') {
    return <>{children}</>;
  }

  // Loading state premium
  if ((status === 'loading' || !mounted)) {
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-gray-950">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />
        <div className="relative flex flex-col items-center gap-8">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
             <img src="/logoescalafin.png" alt="Logo" className="h-10 object-contain animate-pulse" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <h3 className="font-black text-gray-900 dark:text-white tracking-tight">EscalaFin</h3>
            <div className="flex items-center gap-2">
               <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
               <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
               <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Layout principal
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <OfflineBanner />
      
      {/* Navegación: Solo se renderiza si está montado y hay sesión */}
      {mounted && session && (
        <>
          {!isMobile && <DesktopNavbar />}
          {isMobile && (
            <>
              <MobileSidebar />
              <BottomNavbar />
            </>
          )}
        </>
      )}

      {/* Contenido principal: Estructura simple y estable */}
      <main className={cn(
        "transition-all duration-300 min-h-screen",
        isMobile ? "pb-28 pt-4 px-2" : "pt-4"
      )}>
        <div className={cn(
          "mx-auto transition-all",
          isMobile ? "w-full" : "max-w-7xl p-4 md:p-6"
        )}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
