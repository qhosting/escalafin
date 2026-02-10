
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import { MainLayout } from '@/components/layout/main-layout'
import { ChatwootWidget } from '@/components/chatwoot/chatwoot-widget'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'EscalaFin - Sistema de Gestión de Créditos',
  description: 'Plataforma completa para la gestión de préstamos y créditos',
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#2563eb',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // 1. Obtener slug del header inyectado por middleware
  const headersList = headers();
  const tenantSlug = headersList.get('x-tenant-slug') || 'default-tenant';

  // 2. Fetch tenant
  let tenant = null;
  try {
    tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        status: true,
        logo: true,
        primaryColor: true
      }
    });

    // Fallback si no existe (por seguridad)
    if (!tenant) {
      tenant = await prisma.tenant.findUnique({
        where: { slug: 'default-tenant' },
        select: { id: true, name: true, slug: true, domain: true, status: true, logo: true, primaryColor: true }
      });
    }
  } catch (error) {
    console.error('Error fetching tenant in Layout:', error);
  }

  return (
    <html lang="es">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className={inter.className} style={{
        ['--primary' as any]: tenant?.primaryColor || '#2563eb',
        ['--primary-foreground' as any]: '#ffffff'
      }}>
        <Providers tenant={tenant}>
          <MainLayout>
            {children}
          </MainLayout>
          <Toaster
            position="top-right"
            richColors
            closeButton
            theme="light"
          />
          <ChatwootWidget enabled={true} autoLoadUser={true} />
        </Providers>
      </body>
    </html>
  )
}
