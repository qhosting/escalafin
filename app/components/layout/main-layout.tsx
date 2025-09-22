
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
  const { data: session, status } = useSession() || {};
  
  // No mostrar layout en páginas de autenticación
  if (NO_LAYOUT_PATHS.includes(pathname)) {
    return <>{children}</>;
  }
  
  // Para la landing page ('/'), mostrar siempre el contenido sin layout
  if (pathname === '/') {
    return <>{children}</>;
  }
  
  // Loading state solo para rutas protegidas y solo si realmente está cargando
  if (status === 'loading' && pathname !== '/') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando...</p>
        </div>
      </div>
    );
  }
  
  // Si no hay sesión para rutas protegidas, mostrar el contenido
  // (el middleware se encargará de redirigir si es necesario)
  if (!session && pathname !== '/') {
    // Para rutas que requieren autenticación, mostrar un layout mínimo
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <main className="pt-4">
          <div className="max-w-7xl mx-auto p-4 md:p-6">
            {children}
          </div>
        </main>
      </div>
    );
  }
  
  // Layout autenticado con navegación
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Navegación Desktop */}
      <DesktopNavbar />
      
      {/* Navegación Mobile */}
      <MobileSidebar />
      
      {/* Contenido principal con padding para compensar navbar fijo */}
      <main className="pt-0 md:pt-0">
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default MainLayout;
