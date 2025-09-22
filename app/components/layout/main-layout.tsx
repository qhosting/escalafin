
'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DesktopNavbar } from './desktop-navbar';
import { MobileSidebar } from './mobile-sidebar';

const NO_LAYOUT_PATHS = ['/auth/login', '/auth/register'];

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  
  // No mostrar layout en páginas de autenticación o si no hay sesión
  if (NO_LAYOUT_PATHS.includes(pathname) || !session) {
    return <>{children}</>;
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navegación Desktop */}
      <DesktopNavbar />
      
      {/* Navegación Mobile */}
      <MobileSidebar />
      
      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
