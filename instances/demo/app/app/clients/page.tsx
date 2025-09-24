
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function ClientsRedirectPage() {
  const router = useRouter();
  const { data: session, status } = useSession() || {};

  useEffect(() => {
    if (status === 'loading') return; // Esperar a que cargue la sesión
    
    if (!session) {
      router.replace('/auth/login');
      return;
    }

    // Redirigir según el rol del usuario
    const userRole = (session as any)?.user?.role;
    
    if (userRole === 'ADMIN' || userRole === 'ASESOR') {
      router.replace('/admin/clients');
    } else if (userRole === 'CLIENTE') {
      router.replace('/cliente/dashboard');
    } else {
      router.replace('/auth/login');
    }
  }, [session, status, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-300">Redirigiendo...</p>
      </div>
    </div>
  );
}
