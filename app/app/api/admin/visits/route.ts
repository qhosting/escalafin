export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role === 'CLIENTE') {
        return NextResponse.json({ error: 'Prohibido' }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    const [visits, totalCount] = await Promise.all([
      tenantPrisma.collectionVisit.findMany({
        where: session.user.role === 'ASESOR' ? { advisorId: session.user.id } : {},
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            }
          },
          loan: {
            select: {
              id: true,
              loanNumber: true,
            }
          },
          advisor: {
            select: {
              firstName: true,
              lastName: true,
            }
          }
        },
        orderBy: { visitDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      tenantPrisma.collectionVisit.count({
        where: session.user.role === 'ASESOR' ? { advisorId: session.user.id } : {}
      })
    ]);

    return NextResponse.json({
      visits,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
