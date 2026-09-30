import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    const tenantId = (session as any)?.user?.tenantId;

    if (!tenantId) {
      // Return default branding if not logged in or default
      return NextResponse.json({
        id: 'default-tenant',
        name: 'EscalaFin',
        slug: 'escalafin',
        logo: '/logo.svg',
        primaryColor: '#00b4d8',
      });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: tenantId },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        primaryColor: true,
        status: true,
        email: true,
        phone: true,
        address: true,
        createdAt: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({
        id: tenantId,
        name: 'EscalaFin',
        slug: 'escalafin',
        logo: '/logo.svg',
      });
    }

    return NextResponse.json(tenant);
  } catch (error: any) {
    console.error('Error fetching tenant metadata:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener datos de organización' }, { status: 500 });
  }
}

