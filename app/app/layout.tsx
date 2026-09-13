import React from 'react'
import type { Metadata } from 'next'
import { headers } from 'next/headers'
import './globals.css'
import { Providers } from './providers'
import { Toaster } from 'sonner'
import { MainLayout } from '@/components/layout/main-layout'
import { isPublicPage, SITE_URL } from '@/lib/public-pages'
import { MarketingAnalytics } from '@/components/marketing/marketing-analytics'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic';



export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'EscalaFin — Gestión de créditos y cobranza', template: '%s | EscalaFin' },
  robots: { index: false, follow: false },
  description: 'Plataforma integral para microfinancieras modernas: cobranza offline PWA, trazabilidad GPS, firewall CONDUSEF, conciliación automática y recuperación de cartera.',
  keywords: ['microfinanciera', 'cobranza en campo', 'créditos grupales', 'sistema para prestamistas', 'condusef redeco', 'software microcréditos'],
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION } : undefined,
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'EscalaFin OS',
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    'mobile-web-app-capable': 'yes',
  }
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,

  themeColor: '#2563eb',
}

interface RootLayoutProps {
  children: React.ReactNode
}

export default async function RootLayout({ children }: RootLayoutProps) {
  // 1. Obtener slug del header inyectado por middleware
  const headersList = headers();
  const tenantSlug = headersList.get('x-tenant-slug') || 'default-tenant';
  const publicPage = isPublicPage(headersList.get('x-pathname') || '');

  // 2. Fetch tenant
  let tenant = null;
  try {
    if (!publicPage || tenantSlug !== 'default-tenant') tenant = await prisma.tenant.findUnique({
      where: { slug: tenantSlug },
      select: {
        id: true,
        name: true,
        slug: true,
        domain: true,
        status: true,
        logo: true,
        primaryColor: true,
        timezone: true,
        createdAt: true
      }
    });

    // Fallback si no existe (por seguridad)
    if (!tenant && !publicPage && tenantSlug === 'default-tenant') {
      tenant = await prisma.tenant.findUnique({
        where: { slug: 'default-tenant' },
        select: { id: true, name: true, slug: true, domain: true, status: true, logo: true, primaryColor: true, timezone: true, createdAt: true }
      });
    }
  } catch (error) {
    console.error('Error fetching tenant in Layout:', error);
  }

  return (
    <html lang="es">
      <body className="font-sans" style={{
        ['--primary' as any]: tenant?.primaryColor || '#2563eb',
        ['--primary-foreground' as any]: '#ffffff'
      }}>
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[10000] focus:bg-white focus:p-3 focus:text-black">Saltar al contenido</a>
        <MarketingAnalytics />
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
        </Providers>
      </body>
    </html>
  )
}
