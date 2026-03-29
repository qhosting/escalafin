
import { MetadataRoute } from 'next';
import { headers } from 'next/headers';
import { prisma } from '@/lib/prisma';

/**
 * Dynamic PWA Manifest for Next.js 14+
 * Generates tenant-specific manifest based on the domain/slug.
 */
export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const headersList = headers();
  const host = headersList.get('host') || '';
  const tenantSlug = headersList.get('x-tenant-slug') || 'default-tenant';

  // Fetch tenant info from DB if possible
  let tenantName = 'EscalaFin';
  let primaryColor = '#2563eb';
  let description = 'Sistema Integral de Gestión de Créditos';

  try {
    const tenant = await prisma.tenant.findUnique({
      where: host.includes('localhost') ? { slug: 'default-tenant' } : { domain: host },
      select: { name: true, primaryColor: true }
    });

    if (tenant) {
      tenantName = tenant.name;
      primaryColor = tenant.primaryColor || primaryColor;
      description = `Portal Oficial de ${tenant.name}`;
    }
  } catch (error) {
    console.error('Error fetching tenant for manifest:', error);
  }

  return {
    name: tenantName,
    short_name: tenantName,
    description: description,
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: primaryColor,
    icons: [
      {
        src: '/icons/icon-72x72.png',
        sizes: '72x72',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    shortcuts: [
      {
        name: 'Portal Cliente',
        short_name: 'Cliente',
        url: '/pwa/client',
        icons: [{ src: '/icons/client-icon.png', sizes: '192x192' }]
      },
      {
        name: 'Portal Asesor',
        short_name: 'Asesor',
        url: '/pwa/asesor',
        icons: [{ src: '/icons/asesor-icon.png', sizes: '192x192' }]
      }
    ],
  };
}
