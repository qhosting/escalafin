import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TenantBackupService } from '@/lib/tenant-backup-service';
import { AuditLogger } from '@/lib/audit';
import { prisma } from '@/lib/db';

const auditLogger = new AuditLogger(prisma);

export const dynamic = 'force-dynamic';

/**
 * Super Admin: Import and overwrite tenant data from a backup
 */
export async function POST(
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

        const { backup, options } = await request.json();

        if (!backup || !backup.metadata) {
            return NextResponse.json({ error: 'Backup inválido o malformado' }, { status: 400 });
        }

        console.log(`📥 Iniciando importación para tenant: ${tenantId}`);
        console.log(`🛠 Opciones: ${JSON.stringify(options)}`);

        // Realizar la importación (esto sobreescribe datos existentes)
        await TenantBackupService.importTenant(tenantId, backup, options);

        // Obtener estadísticas del backup procesado para informar al usuario
        const stats = TenantBackupService.getBackupStats(backup);

        // Log de auditoría para una acción tan destructiva y crítica
        await auditLogger.log({
            userId: session.user.id,
            userEmail: session.user.email,
            action: 'TENANT_RESTORE',
            resource: 'Tenant',
            resourceId: tenantId,
            details: {
                tenantName: stats.tenantName,
                counts: stats.counts,
                options
            }
        });

        return NextResponse.json({
            message: 'Importación completada exitosamente',
            stats
        });
    } catch (error: any) {
        console.error('Error importing tenant backup:', error);
        return NextResponse.json(
            { error: error.message || 'Error al importar backup' },
            { status: 500 }
        );
    }
}
