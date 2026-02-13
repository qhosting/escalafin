import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TenantBackupService } from '@/lib/tenant-backup-service';
import { AuditLogger } from '@/lib/audit';
import { prisma } from '@/lib/db';

const auditLogger = new AuditLogger(prisma);

export const dynamic = 'force-dynamic';

/**
 * Super Admin: Export all data from a tenant as JSON
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const tenantId = params.id;
        if (!tenantId) {
            return NextResponse.json({ error: 'ID de organización requerido' }, { status: 400 });
        }

        console.log(`📦 Iniciando exportación para tenant: ${tenantId}`);
        const backup = await TenantBackupService.exportTenant(tenantId);

        // Registro de auditoría
        await auditLogger.log({
            userId: session.user.id,
            userEmail: session.user.email,
            action: 'TENANT_EXPORT',
            resource: 'Tenant',
            resourceId: tenantId,
            details: {
                tenantName: backup.metadata.tenantName,
                tenantSlug: backup.metadata.tenantSlug,
                dataCounts: {
                    users: backup.users?.length || 0,
                    clients: backup.clients?.length || 0,
                    loans: backup.loans?.length || 0,
                    payments: backup.payments?.length || 0
                }
            }
        });

        return NextResponse.json(backup, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="backup-${backup.metadata.tenantSlug}-${new Date().toISOString().split('T')[0]}.json"`
            }
        });
    } catch (error: any) {
        console.error('Error exporting tenant:', error);
        return NextResponse.json(
            { error: error.message || 'Error al exportar backup' },
            { status: 500 }
        );
    }
}
