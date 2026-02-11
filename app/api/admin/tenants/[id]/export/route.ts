import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TenantBackupService } from '@/lib/tenant-backup-service';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const tenantId = params.id;

        // Export tenant data
        const backup = await TenantBackupService.exportTenant(tenantId);
        const stats = TenantBackupService.getBackupStats(backup);

        console.log(`📦 Backup exportado para tenant ${backup.metadata.tenantName}:`, stats);

        // Return as downloadable JSON file
        const fileName = `backup-${backup.metadata.tenantSlug}-${new Date().toISOString().split('T')[0]}.json`;

        return new NextResponse(JSON.stringify(backup, null, 2), {
            status: 200,
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="${fileName}"`,
            },
        });
    } catch (error) {
        console.error('Error exporting tenant:', error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : 'Error al exportar tenant' },
            { status: 500 }
        );
    }
}
