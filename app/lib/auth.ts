
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        tenantSlug: { label: 'Tenant Slug', type: 'text' }
      },
      async authorize(credentials) {
        console.log('🔍 NextAuth authorize llamado con:', {
          email: credentials?.email,
          tenantSlug: credentials?.tenantSlug
        });

        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Credenciales faltantes');
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
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

            if (requestedTenant && user.role !== 'SUPER_ADMIN' && user.tenantId !== requestedTenant.id) {
              console.log('❌ Usuario no pertenece a este tenant:', {
                userTenant: user.tenantId,
                requestedTenant: requestedTenant.id
              });
              return null;
            }
          }

          const passwordMatch = await bcrypt.compare(credentials.password, user.password);

          if (!passwordMatch) {
            console.log('❌ Password no coincide');
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
            tenantId: user.tenantId
          };
        } catch (error) {
          console.error('💥 Auth error:', error);
          return null;
        }
      },
    }),
  ],
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.tenantId = token.tenantId as string | null;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Siempre permitir el signin si el user existe
      return !!user;
    },
    async redirect({ url, baseUrl }) {
      console.log('🔄 Redirect callback:', { url, baseUrl });

      // Si es una URL relativa, usar baseUrl
      if (url.startsWith('/')) {
        const finalUrl = `${baseUrl}${url}`;
        console.log('✅ Usando URL relativa:', finalUrl);
        return finalUrl;
      }

      // Si la URL es del mismo dominio, permitir
      try {
        const urlOrigin = new URL(url).origin;
        const baseOrigin = new URL(baseUrl).origin;

        if (urlOrigin === baseOrigin) {
          console.log('✅ URL del mismo dominio:', url);
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
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
};
