
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface AuthWrapperProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function AuthWrapper({ children, allowedRoles, redirectTo = '/auth/login' }: AuthWrapperProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session?.user || !allowedRoles.includes(session.user.role)) {
      router.replace(redirectTo);
    }
  }, [session, status, router, allowedRoles, redirectTo]);

  if (!mounted || status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session?.user || !allowedRoles.includes(session.user.role)) {
    return null;
  }

  return <>{children}</>;
}
