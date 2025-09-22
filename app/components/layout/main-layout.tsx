
'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from './sidebar';
import { Header } from './header';

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
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar - Solo desktop */}
      <Sidebar />
      
      {/* Contenido principal */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />
        
        {/* Área de contenido */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
