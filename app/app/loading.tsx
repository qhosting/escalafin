'use client';

import { usePathname } from 'next/navigation';
import { 
  AdminSkeleton, 
  ClienteSkeleton, 
  AuthSkeleton, 
  GenericSpinner 
} from '@/components/layout/loading-variants';

export default function Loading() {
  const pathname = usePathname();

  // Determinamos qué skeleton mostrar basado en la ruta
  const isAuth = pathname?.startsWith('/auth');
  const isAdmin = pathname?.startsWith('/admin');
  const isCliente = pathname?.startsWith('/cliente');
  const isAsesor = pathname?.startsWith('/asesor');
  const isMobile = pathname?.startsWith('/mobile');

  return (
    <div className="relative">
      {/* Barra de progreso global (siempre visible en carga) */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-[10000] overflow-hidden">
        <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-500 to-blue-600 animate-shimmer-x" />
      </div>

      <div className="min-h-screen">
        {isAdmin && <AdminSkeleton />}
        {isAsesor && <AdminSkeleton />} {/* Los asesores usan una variante similar al admin */}
        {isCliente && <ClienteSkeleton />}
        {isMobile && <ClienteSkeleton />} {/* Mobile usa variante similar al cliente */}
        {isAuth && <AuthSkeleton />}
        
        {/* Spinner genérico si no coincide con ninguna ruta específica o si está cargando raíz */}
        {!isAdmin && !isAsesor && !isCliente && !isMobile && !isAuth && <GenericSpinner />}
      </div>

      <style jsx global>{`
        @keyframes shimmer-x {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        .animate-shimmer-x {
          animation: shimmer-x 1.4s ease-in-out infinite;
        }
        @keyframes shimmer {
          100% { transform: translateX(200%); }
        }
      `}</style>
    </div>
  );
}
