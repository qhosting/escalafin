
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { AuditLogger } from '@/lib/audit';
import { extractRequestInfo } from '@/lib/audit';
import { getTenantPrisma } from '@/lib/tenant-db';
import { prisma as globalPrisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    // Auth check - allow super admin without tenantId
    if (!session || (!session.user.tenantId && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Role check
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Determinar scope
    const sessionTenantId = session.user.tenantId;
    const filterTenantId = searchParams.get('tenantId');
    const tenantId = (session.user.role === 'SUPER_ADMIN' && filterTenantId) ? filterTenantId : sessionTenantId;

    // Aplicar los mismos filtros que en la consulta normal
    const filters: any = {};

    if (session.user.role !== 'SUPER_ADMIN' || tenantId) {
      filters.tenantId = tenantId;
    }

    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) filters.timestamp.gte = new Date(startDate);
      if (endDate) filters.timestamp.lte = new Date(endDate);
    }

    // Choose db client: specific tenant or global/all for super admin
    const dbClient = tenantId ? getTenantPrisma(tenantId) : globalPrisma;

    const logs = await (dbClient as any).auditLog.findMany({
      where: filters,
      orderBy: { timestamp: 'desc' },
      take: 10000, // Límite para exportación
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (format === 'csv') {
      // Generar CSV
      const csvHeader = 'Fecha,Usuario,Email,Rol,Acción,Recurso,ID Recurso,IP,Detalles\n';
      const csvRows = logs.map((log: any) => {
        const userName = log.user ? `${log.user.firstName} ${log.user.lastName}` : '';
        const userEmail = log.user?.email || log.userEmail || '';
        const userRole = log.user?.role || '';
        const details = log.details ? JSON.stringify(log.details).replace(/"/g, '""') : '';

        return [
          log.timestamp.toISOString(),
          `"${userName}"`,
          `"${userEmail}"`,
          `"${userRole}"`,
          `"${log.action}"`,
          `"${log.resource || ''}"`,
          `"${log.resourceId || ''}"`,
          `"${log.ipAddress || ''}"`,
          `"${details}"`
        ].join(',');
      }).join('\n');

      const csvContent = csvHeader + csvRows;

      // Log de auditoría para la exportación
      const auditLog = new AuditLogger(dbClient as any);
      const requestInfo = extractRequestInfo(request);
      await auditLog.log({
        userId: session.user.id,
        userEmail: session.user.email,
        tenantId: session.user.tenantId || undefined,
        action: 'EXPORT_REPORT',
        resource: 'AuditLog',
        details: {
          format,
          recordCount: logs.length,
          filters,
        },
        ...requestInfo,
      });

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename=audit_logs_${new Date().toISOString().split('T')[0]}.csv`,
        },
      });
    }

    return NextResponse.json({ error: 'Formato no soportado' }, { status: 400 });
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    return NextResponse.json(
      { error: 'Error al exportar logs de auditoría' },
      { status: 500 }
    );
  }
}
