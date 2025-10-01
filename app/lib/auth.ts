
import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@next-auth/prisma-adapter';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        console.log('🔍 NextAuth authorize llamado con:', { email: credentials?.email });
        
        if (!credentials?.email || !credentials?.password) {
          console.log('❌ Credenciales faltantes');
          return null;
        }

        try {
          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          if (!user || !user.password) {
            console.log('❌ Usuario no encontrado o sin password');
            return null;
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
            role: user.role 
          });

          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
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
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
      }
      return session;
    },
    async signIn({ user, account }) {
      // Siempre permitir el signin si el user existe
      return !!user;
    },
    async redirect({ url, baseUrl }) {
      // Si es una URL relativa, usar baseUrl
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      // Si la URL es del mismo dominio, permitir
      else if (new URL(url).origin === baseUrl) {
        return url;
      }
      // Por defecto, redirigir al baseUrl
      return baseUrl;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
  debug: true, // Siempre debug para diagnosticar
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: false, // Deshabilitar cookies seguras para desarrollo
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' ? '__Secure-next-auth.session-token' : 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: false, // No usar cookies seguras en desarrollo
      },
    },
  },
};
