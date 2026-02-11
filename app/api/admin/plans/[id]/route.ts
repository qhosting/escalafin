import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditLogger } from '@/lib/audit';

const auditLogger = new AuditLogger(prisma);

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const planId = params.id;

        // Check if plan exists
        const plan = await prisma.plan.findUnique({
            where: { id: planId },
            include: {
                _count: {
                    select: { subscriptions: true }
                }
            }
        });

        if (!plan) {
            return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
        }

        // Check if plan has active subscriptions
        if (plan._count.subscriptions > 0) {
            return NextResponse.json(
                {
                    error: 'No se puede eliminar un plan con suscripciones activas',
                    subscriptionsCount: plan._count.subscriptions
                },
                { status: 409 }
            );
        }

        // Delete plan
        await prisma.plan.delete({
            where: { id: planId }
        });

        await auditLogger.log({
            userId: session.user.id,
            action: 'PLAN_DELETE',
            resource: 'PLAN',
            resourceId: planId,
            details: { name: plan.name, displayName: plan.displayName }
        });

        console.log(`🗑️ Plan eliminado: ${plan.displayName} (${plan.name})`);

        return NextResponse.json({
            success: true,
            message: 'Plan eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error deleting plan:', error);
        return NextResponse.json(
            { error: 'Error al eliminar plan' },
            { status: 500 }
        );
    }
}
