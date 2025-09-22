
'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from './sidebar';
import { HeaderMobile } from './header-mobile';

const NO_LAYOUT_PATHS = ['/auth/login', '/auth/register', '/'];

interface LayoutProviderProps {
  children: React.ReactNode;
}

export function LayoutProvider({ children }: LayoutProviderProps) {
  const pathname = usePathname();
  const { data: session, status } = useSession() || {};
  
  // No mostrar layout en páginas específicas o si no hay sesión
  if (NO_LAYOUT_PATHS.includes(pathname) || !session) {
    return (
      <div className="min-h-screen bg-background">
        {children}
      </div>
    );
  }

  // Layout con navegación para usuarios autenticados
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar - Solo desktop, fijo con scroll */}
        <Sidebar />
        
        {/* Contenido principal */}
        <div className="flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out md:ml-[var(--sidebar-width,16rem)]">
          {/* Header Mobile - Solo móvil */}
          <HeaderMobile />
          
          {/* Área de contenido */}
          <main className="flex-1 overflow-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
