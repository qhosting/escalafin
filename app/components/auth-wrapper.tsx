'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface AuthWrapperProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
  loadingFallback?: React.ReactNode;
}

import { GenericSpinner } from '@/components/layout/loading-variants';

export function AuthWrapper({ 
  children, 
  allowedRoles, 
  redirectTo = '/auth/login',
  loadingFallback = null
}: AuthWrapperProps) {
  const { data: session, status } = useSession() || {};
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted || status === 'loading') return;

    if (!session?.user || (!allowedRoles.includes(session.user.role) && session.user.role !== 'SUPER_ADMIN')) {
      router.replace(redirectTo);
    }
  }, [session, status, router, allowedRoles, redirectTo, mounted]);

  // No renderizar nada hasta que esté montado y la sesión esté cargada
  // Devolvemos el fallback (que puede ser un skeleton) para evitar el "blanco"
  if (!mounted || status === 'loading') {
    return <>{loadingFallback}</>;
  }

  // Si no hay sesión o no tiene permisos, mostrar loading mientras redirige
  if (!session?.user || (!allowedRoles.includes(session.user.role) && session.user.role !== 'SUPER_ADMIN')) {
    return <GenericSpinner />;
  }

  return <>{children}</>;
}
