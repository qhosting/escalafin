
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Building2 } from 'lucide-react';

export function AuthRedirectHandler() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user) {
      router.replace('/auth/login');
      return;
    }

    // Redirigir según el rol del usuario
    switch (session.user.role) {
      case 'ADMIN':
        router.replace('/admin/dashboard');
        break;
      case 'ASESOR':
        router.replace('/asesor/dashboard');
        break;
      case 'CLIENTE':
        router.replace('/cliente/dashboard');
        break;
      default:
        router.replace('/auth/login');
    }
  }, [session, status, router]);

  // Mostrar loading mientras se determina el estado de autenticación
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-800">
      <div className="text-center text-white">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Building2 className="w-12 h-12" />
          <h1 className="text-4xl font-bold">EscalaFin</h1>
        </div>
        <div className="flex items-center justify-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          <p className="text-xl">Cargando...</p>
        </div>
      </div>
    </div>
  );
}
