
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { AuditLogger } from './audit';
import { RateLimiter } from './rate-limit';

function computeImpersonationSignature(superAdminId: string, targetUserId: string, secret: string) {
  return crypto.createHmac('sha256', secret).update(`${superAdminId}:${targetUserId}`).digest('hex');
}

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
    async jwt({ token, user, trigger, session: updateData }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.tenantSlug = (user as any).tenantSlug ?? (user as any).tenant?.slug ?? null;
        token.tenantName = (user as any).tenantName ?? (user as any).tenant?.name ?? null;
      }

      // 🛡️ Verificación continua de integridad y caducidad de intrapersona
      if (token.isImpersonating && token.originalUser) {
        const secret = process.env.NEXTAUTH_SECRET || 'escalafin-auth-fallback-secret-2026';
        const MAX_TTL_MS = 4 * 60 * 60 * 1000; // 4 horas máximo de suplantación
        const isExpired = token.impersonatedAt && (Date.now() - (token.impersonatedAt as number) > MAX_TTL_MS);
        const expectedSig = computeImpersonationSignature(token.originalUser.id, token.sub!, secret);
        const isSignatureInvalid = token.impersonationSig && token.impersonationSig !== expectedSig;

        if (isExpired || isSignatureInvalid) {
          console.warn('🛡️ SEGURIDAD: Sesión de intrapersona expirada o firma adulterada. Revirtiendo a SuperAdmin...');
          const orig = token.originalUser as any;
          token.sub = orig.id;
          token.email = orig.email;
          token.name = orig.name;
          token.role = orig.role;
          token.tenantId = orig.tenantId;
          token.tenantSlug = orig.tenantSlug;
          token.tenantName = orig.tenantName;
          delete token.originalUser;
          delete token.isImpersonating;
          delete token.impersonationSig;
          delete token.impersonatedAt;
        }
      }

      // 🎭 Soporte para Intrapersona / Suplantación segura por SuperAdmin
      if (trigger === 'update' && updateData) {
        if (updateData.action === 'impersonate' && updateData.targetUserId) {
          const targetId = String(updateData.targetUserId).trim();
          
          // 1. Sanitización de identificador para prevenir inyecciones
          if (/^[a-zA-Z0-9_-]{8,64}$/.test(targetId)) {
            const requesterId = token.originalUser?.id || token.sub;
            if (requesterId) {
              // 2. Validación estricta en base de datos: el solicitante REAL debe ser SUPER_ADMIN y estar ACTIVO
              const superAdminUser = await prisma.user.findUnique({
                where: { id: requesterId },
                select: {
                  id: true,
                  role: true,
                  status: true,
                  email: true,
                  firstName: true,
                  lastName: true,
                  tenantId: true,
                  tenant: { select: { slug: true, name: true } },
                },
              });

              if (superAdminUser && superAdminUser.role === UserRole.SUPER_ADMIN && superAdminUser.status === 'ACTIVE') {
                // 3. Prohibir auto-suplantación
                if (targetId !== superAdminUser.id) {
                  const targetUser = await prisma.user.findUnique({
                    where: { id: targetId },
                    include: { tenant: true },
                  });

                  // 4. El usuario objetivo debe existir, estar activo y NO ser otro SuperAdmin
                  if (targetUser && targetUser.status === 'ACTIVE' && targetUser.role !== UserRole.SUPER_ADMIN) {
                    if (!token.originalUser) {
                      token.originalUser = {
                        id: superAdminUser.id,
                        email: superAdminUser.email,
                        name: `${superAdminUser.firstName} ${superAdminUser.lastName}`,
                        role: superAdminUser.role,
                        tenantId: superAdminUser.tenantId,
                        tenantSlug: superAdminUser.tenant?.slug ?? null,
                        tenantName: superAdminUser.tenant?.name ?? null,
                      };
                    }

                    const secret = process.env.NEXTAUTH_SECRET || 'escalafin-auth-fallback-secret-2026';
                    token.sub = targetUser.id;
                    token.email = targetUser.email;
                    token.name = `${targetUser.firstName} ${targetUser.lastName}`;
                    token.role = targetUser.role;
                    token.tenantId = targetUser.tenantId;
                    token.tenantSlug = targetUser.tenant?.slug ?? null;
                    token.tenantName = targetUser.tenant?.name ?? null;
                    token.isImpersonating = true;
                    token.impersonatedAt = Date.now();
                    token.impersonationSig = computeImpersonationSignature(superAdminUser.id, targetUser.id, secret);

                    await AuditLogger.quickLog(
                      null,
                      'LOGIN',
                      {
                        method: 'impersonation_activated',
                        superAdminId: superAdminUser.id,
                        superAdminEmail: superAdminUser.email,
                        targetUserId: targetUser.id,
                        targetUserEmail: targetUser.email,
                        targetRole: targetUser.role,
                        tenantId: targetUser.tenantId,
                      },
                      'Security',
                      targetUser.id,
                      { user: targetUser }
                    ).catch(() => {});
                  }
                }
              } else {
                console.warn('🛡️ ALERTA DE SEGURIDAD: Intento de intrapersona rechazado por credenciales insuficientes');
              }
            }
          }
        } else if (updateData.action === 'stopImpersonate') {
          // Restaurar sesión del SuperAdmin original de forma atómica y limpiar tokens
          if (token.originalUser) {
            const orig = token.originalUser as any;
            token.sub = orig.id;
            token.email = orig.email;
            token.name = orig.name;
            token.role = orig.role;
            token.tenantId = orig.tenantId;
            token.tenantSlug = orig.tenantSlug;
            token.tenantName = orig.tenantName;
            delete token.originalUser;
            delete token.isImpersonating;
            delete token.impersonationSig;
            delete token.impersonatedAt;
          }
        }
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
        session.user.isImpersonating = !!token.isImpersonating;
        session.user.originalUser = token.originalUser || null;
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
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  debug: false,
  secret: process.env.NEXTAUTH_SECRET,
};
