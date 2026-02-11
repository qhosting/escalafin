import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditLogger } from '@/lib/audit';

const auditLogger = new AuditLogger(prisma);

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const resource = searchParams.get('resource');
        const action = searchParams.get('action');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const logs = await auditLogger.getLogs({
            resource: resource || undefined,
            action: action as any || undefined,
            limit,
            offset
        });

        return NextResponse.json(logs);
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return NextResponse.json(
            { error: 'Error al obtener logs de auditoría' },
            { status: 500 }
        );
    }
}
