
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const advisorId = searchParams.get('advisorId');
    const status = searchParams.get('status') as any;

    const records = await prisma.commissionRecord.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(advisorId && { advisorId }),
        ...(status && { status })
      },
      include: {
        advisor: { select: { firstName: true, lastName: true } },
        schema: { select: { name: true, type: true } }
      },
      orderBy: { calculatedAt: 'desc' }
    });

    return NextResponse.json({ success: true, records });
  } catch (error) {
    return NextResponse.json({ error: 'Error al cargar comisiones' }, { status: 500 });
  }
}
