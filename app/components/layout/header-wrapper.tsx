
'use client';

import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Header } from './header';

const NO_HEADER_PATHS = ['/auth/login', '/auth/register'];

export function HeaderWrapper() {
  const pathname = usePathname();
  const { data: session } = useSession() || {};
  
  // No mostrar header en páginas de autenticación o si no hay sesión
  if (NO_HEADER_PATHS.includes(pathname) || !session) {
    return null;
  }
  
  return <Header />;
}
