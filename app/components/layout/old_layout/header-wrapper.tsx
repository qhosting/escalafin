
'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Sidebar } from './sidebar';
import { Header } from './header';
import { HeaderMobile } from './header-mobile';

const NO_HEADER_PATHS = ['/auth/login', '/auth/register'];

export function HeaderWrapper() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  
  // No mostrar header en páginas de autenticación o si no hay sesión
  if (NO_HEADER_PATHS.includes(pathname) || !session) {
    return null;
  }
  
  return (
    <>
      {/* Header Desktop */}
      <Header />
      
      {/* Header Mobile */}
      <HeaderMobile />
    </>
  );
}
