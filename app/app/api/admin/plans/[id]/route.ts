import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditLogger } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const auditLogger = new AuditLogger(prisma);

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SUPER_ADMIN', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = params;
    const plan = await prisma.plan.findUnique({
      where: { id },
      include: {
        _count: {
          select: { subscriptions: true }
        }
      }
    });

    if (!plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    return NextResponse.json(plan);
  } catch (error: any) {
    console.error('Error fetching plan:', error);
    return NextResponse.json({ error: error.message || 'Error al obtener plan' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id } = params;

    // Check if plan has active subscriptions
    const subCount = await prisma.tenantSubscription.count({
      where: { planId: id, status: 'ACTIVE' }
    });

    if (subCount > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un plan con suscripciones activas' },
        { status: 400 }
      );
    }

    const plan = await prisma.plan.delete({
      where: { id }
    });

    await auditLogger.log({
      userId: session.user.id,
      action: 'PLAN_DELETE',
      resource: 'PLAN',
      resourceId: id,
      details: { name: plan.name, displayName: plan.displayName }
    });

    return NextResponse.json({ success: true, plan });
  } catch (error: any) {
    console.error('Error deleting plan:', error);
    return NextResponse.json({ error: error.message || 'Error al eliminar plan' }, { status: 500 });
  }
}
