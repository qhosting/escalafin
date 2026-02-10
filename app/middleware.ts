
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // Lógica de Multi-tenancy
    const hostname = req.headers.get('host') || '';

    // Configuración de dominios
    // En producción: app.escalafin.com -> default-tenant
    // alquileres.escalafin.com -> alquileres
    const rootDomain = process.env.ROOT_DOMAIN || 'escalafin.com';
    const isLocalhost = hostname.includes('localhost');

    let tenantSlug = 'default-tenant';

    // 1. Identificar Tenant por Subdominio
    if (isLocalhost) {
      // Desarrollo: subdominio.localhost:3000
      // ejemplo: tenant1.localhost:3000
      const parts = hostname.split('.');
      // Si hay partes y no es solo 'localhost:3000' (que length sería 1 o 2 dependiendo del puerto a veces parseado, pero split . separa localhost:3000 como 1 array)
      // localhost:3000 -> ['localhost:3000']
      // tenant1.localhost:3000 -> ['tenant1', 'localhost:3000']
      if (parts.length > 1) {
        tenantSlug = parts[0];
      }
    } else {
      // Producción
      if (hostname.endsWith(`.${rootDomain}`)) {
        const parts = hostname.split('.');
        // parts[0] sería el subdominio
        if (parts.length >= 3) {
          const sub = parts[0];
          if (sub !== 'www' && sub !== 'app') {
            tenantSlug = sub;
          }
        }
      }
      // Soporte para dominios custom podría agregarse aquí consultando un KV store
    }

    // 2. Inyectar Headers
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-tenant-slug', tenantSlug);
    requestHeaders.set('x-url', req.url);

    // 3. Validación de Acceso Cruzado (Cross-Tenant)
    const token = req.nextauth.token;
    if (token && tenantSlug !== 'default-tenant') {
      const userTenantSlug = token.tenantSlug as string;
      const userRole = token.role as string;

      // Si no es Super Admin y el slug del host no coincide con el del usuario
      if (userRole !== 'SUPER_ADMIN' && userTenantSlug && userTenantSlug !== tenantSlug) {
        console.log(`🚫 Bloqueo Cross-Tenant: Usuario de ${userTenantSlug} intentó entrar a ${tenantSlug}`);

        // Redirigir a su propio subdominio si estamos en producción, 
        // o simplemente mostrar error/logout en desarrollo para evitar loops infinitos complejos
        if (isLocalhost) {
          return NextResponse.redirect(new URL(`/auth/login?error=TenantMismatch&expected=${userTenantSlug}`, req.url));
        } else {
          const protocol = req.nextUrl.protocol;
          return NextResponse.redirect(`${protocol}//${userTenantSlug}.${rootDomain}${req.nextUrl.pathname}`);
        }
      }
    }

    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
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
          pathname.startsWith('/api/public/') || // Hooks públicos
          pathname.startsWith('/api/webhooks/') ||
          pathname.startsWith('/_next/') ||
          pathname.includes('.') // Archivos estáticos
        ) {
          return true;
        }

        // Permitir APIS generales (manejan su propia seguridad con tokens o session)
        if (pathname.startsWith('/api/')) {
          return true;
        }

        // Requerir autenticación para todas las demás rutas de UI
        if (!token) {
          return false;
        }

        // Control de acceso basado en roles
        const userRole = token.role as string;

        // 🟢 Rutas Críticas de Super Administrador (SaaS Global)
        if (pathname.startsWith('/admin/saas')) {
          return userRole === 'SUPER_ADMIN';
        }

        // Rutas de admin (locales del tenant)
        if (pathname.startsWith('/admin/')) {
          return userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        }

        // Rutas de asesor
        if (pathname.startsWith('/asesor/')) {
          return userRole === 'ASESOR' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        }

        // Rutas de cliente
        if (pathname.startsWith('/cliente/')) {
          return userRole === 'CLIENTE' || userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
        }

        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
