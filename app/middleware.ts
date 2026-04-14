
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;

    const hostname = req.headers.get('host') || '';
    const rootDomain = process.env.ROOT_DOMAIN || 'escalafin.com';
    const isLocalhost = hostname.includes('localhost');

    // 🛡️ SEGURIDAD: Bloqueo de escaneos y URLs maliciosas
    const maliciousPatterns = [
      '/wp-admin', '/wp-login', '.env', 'config.php', '/admin.php', 
      '/.git', '/composer.json', '/package.json', '/id_rsa',
      '/setup.php', '/phpmyadmin', '/xmlrpc.php', '/shell',
      '/backup', '/storage', '/sql', '/dump', '/db.sql'
    ];

    // Solo aplicar bloqueo si NO es una ruta de API legítima o si coincide con patrones críticos
    const isApiRequest = pathname.startsWith('/api/');
    const isMalicious = maliciousPatterns.some(pattern => {
      // Si es API, solo bloquear si el patrón es ARCHIVO crítico (.env, .git, etc)
      if (isApiRequest) {
        return pathname.toLowerCase().endsWith(pattern) || 
               pathname.toLowerCase().includes('/' + pattern) ||
               (pattern.startsWith('.') && pathname.toLowerCase().includes(pattern));
      }
      return pathname.toLowerCase().includes(pattern);
    });

    if (isMalicious) {
      const detectedPattern = maliciousPatterns.find(p => pathname.toLowerCase().includes(p));
      const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || req.ip || 'desconocida';
      
      console.warn(`🛡️ BLOQUEO DE SEGURIDAD: Intento de acceso a ruta prohibida [${pathname}] desde IP: ${clientIp}`);
      
      // Registrar el evento asincrónicamente
      // Usamos el host directamente para evitar problemas de SSL local si la app está tras un proxy
      const protocol = isLocalhost ? 'http' : (req.headers.get('x-forwarded-proto') || 'http');
      const host = req.headers.get('host');
      const internalUrl = `${protocol}://${host}/api/internal/security-log`;

      fetch(internalUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-internal-secret': process.env.NEXTAUTH_SECRET || ''
        },
        body: JSON.stringify({
          ip: clientIp,
          userAgent: req.headers.get('user-agent') || 'unknown',
          path: pathname,
          pattern: detectedPattern
        })
      }).catch(e => {
        // Silenciamos errores de red internos para no afectar la respuesta al usuario malicioso
        console.error('Error triggering security log:', e.message);
      });

      return new NextResponse(
        JSON.stringify({ 
          error: 'Acceso Denegado por Seguridad - IP Registrada', 
          code: 'SECURITY_BLOCK' 
        }), 
        { status: 403, headers: { 'content-type': 'application/json' } }
      );
    }


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
