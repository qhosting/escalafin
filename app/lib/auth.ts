
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { AuditLogger } from './audit';
import { RateLimiter } from './rate-limit';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantSlug: { label: 'Tenant Slug', type: 'text' }
      },
      async authorize(credentials, req) {
        // 🛡️ Rate Limiting por IP (Máximo 5 intentos por minuto)
        const clientIp = (req as any)?.headers?.['x-forwarded-for']?.split(',')[0] || 'unknown';
        const rateLimit = await RateLimiter.checkByIp(clientIp, 'login', 5, 60);
        
        if (!rateLimit.success) {
          console.warn(`🛡️ RATE LIMIT: Bloqueado intento de login desde IP ${clientIp}. Reintentar en ${rateLimit.reset}s`);
          throw new Error(`Demasiados intentos fallidos. Por favor, espere ${rateLimit.reset} segundos.`);
        }

        console.log('🔍 NextAuth authorize llamado con:', {
          email: credentials?.email,
          tenantSlug: credentials?.tenantSlug
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Credenciales faltantes');
          return null;
        }

        try {
          const user = await prisma.user.findFirst({
            where: {
              OR: [
                { email: credentials.email },
                { phone: credentials.email }
              ]
            },
            include: {
              tenant: true
            }
          });

          if (!user || !user.password) {
            console.log('❌ Usuario no encontrado o sin password');
            return null;
          }

          // Validación de Tenant basado en Subdominio
          if (credentials.tenantSlug && credentials.tenantSlug !== 'default-tenant') {
            const requestedTenant = await prisma.tenant.findUnique({
              where: { slug: credentials.tenantSlug }
            });

            if (requestedTenant && user.role !== UserRole.SUPER_ADMIN && user.tenantId !== requestedTenant.id) {
              console.log('❌ Usuario no pertenece a este tenant:', {
                userTenant: user.tenantId,
                requestedTenant: requestedTenant.id
              });
              return null;
            }
          }

          let passwordMatch = await bcrypt.compare(credentials.password, user.password);

          // Si el password no coincide, verificar si es un código OTP válido
          if (!passwordMatch && credentials.password.length === 6) {
            const otpToken = await prisma.verificationToken.findFirst({
              where: {
                identifier: user.id,
                token: credentials.password,
              }
            });

            if (otpToken && new Date() < otpToken.expires) {
              passwordMatch = true;
              // Opcional: Eliminar el token usado
              await prisma.verificationToken.deleteMany({ 
                where: { 
                  identifier: user.id,
                  token: credentials.password 
                } 
              }).catch(() => {});
            }
          }

          if (!passwordMatch) {
            console.log('❌ Password/OTP no coincide');
            return null;
          }

          if (user.status !== 'ACTIVE') {
            console.log('❌ Usuario no activo:', user.status);
            return null;
          }


          console.log('✅ Usuario autenticado exitosamente:', {
            id: user.id,
            email: user.email,
            role: user.role,
            tenantId: user.tenantId
          });

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            tenantId: user.tenantId,
            tenantSlug: user.tenant?.slug || null,
            tenantName: user.tenant?.name || 'EscalaFin'
          };
        } catch (error) {
          console.error('💥 Auth error:', error);
          return null;
        }
      },
    }),
  ],
  events: {
    async signIn({ user }) {
      await AuditLogger.quickLog(null, 'LOGIN', { method: 'credentials' }, 'Auth', user.id, { user });
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // 24 horas
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = (user as any).tenant?.slug;
        token.tenantName = (user as any).tenantName;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string | null;
        session.user.tenantSlug = token.tenantSlug as string | null;
        session.user.tenantName = token.tenantName as string | null;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Siempre permitir el signin si el user existe
      return !!user;
    },
    async redirect({ url, baseUrl }) {
      // Logic for redirects

      // Si la URL es explícitamente la de login, redirigir según rol
      // (esto evita el loop login → login)
      if (url.includes('/auth/login') || url === baseUrl || url === `${baseUrl}/`) {
        // No podemos leer el token aquí directamente, devolvemos baseUrl
        // y dejamos que el MainLayout / middleware redirija según rol
        return baseUrl;
      }

      // Si es una URL relativa, usar baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }

      // Si la URL es del mismo dominio, permitir
      try {
        const urlOrigin = new URL(url).origin;
        const baseOrigin = new URL(baseUrl).origin;

        if (urlOrigin === baseOrigin) {
          return url;
        }
      } catch (error) {
        console.error('❌ Error parseando URLs:', error);
      }

      // Por defecto, redirigir al baseUrl
      console.log('✅ Redirigiendo a baseUrl:', baseUrl);
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  debug: false,
  secret: process.env.NEXTAUTH_SECRET,
};
