import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TenantBackupService } from '@/lib/tenant-backup-service';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const tenantId = params.id;
        const body = await request.json();

        const { backup, options } = body;

        if (!backup || !backup.metadata) {
            return NextResponse.json(
                { error: 'Formato de backup inválido' },
                { status: 400 }
            );
        }

        // Validate backup version
        if (backup.metadata.exportVersion !== '1.0.0') {
            return NextResponse.json(
                { error: 'Versión de backup no compatible' },
                { status: 400 }
            );
        }

        const stats = TenantBackupService.getBackupStats(backup);
        console.log(`📥 Importando backup de ${backup.metadata.tenantName}:`, stats);

        // Import data
        await TenantBackupService.importTenant(tenantId, backup, options);

        console.log(`✅ Backup importado exitosamente para tenant ${tenantId}`);

        return NextResponse.json({
            success: true,
            message: 'Backup importado exitosamente',
            stats
        });
    } catch (error) {
        console.error('Error importing tenant backup:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al importar backup' },
            { status: 500 }
        );
    }
}
