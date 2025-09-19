
import { withAuth } from 'next-auth/middleware';

export default withAuth(
  function middleware(req) {
    // Middleware personalizado si es necesario
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;
        
        // Permitir acceso a rutas públicas
        if (
          pathname.startsWith('/auth/') ||
          pathname === '/' ||
          pathname.startsWith('/api/auth/') ||
          pathname.startsWith('/api/signup')
        ) {
          return true;
        }

        // Requerir autenticación para todas las demás rutas
        if (!token) {
          return false;
        }

        // Control de acceso basado en roles
        const userRole = token.role as string;
        
        // Rutas de admin
        if (pathname.startsWith('/admin/')) {
          return userRole === 'ADMIN';
        }
        
        // Rutas de asesor
        if (pathname.startsWith('/asesor/')) {
          return userRole === 'ASESOR' || userRole === 'ADMIN';
        }
        
        // Rutas de cliente
        if (pathname.startsWith('/cliente/')) {
          return userRole === 'CLIENTE' || userRole === 'ADMIN';
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
