
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';
import { AuditLogger } from '@/lib/audit';
import { extractRequestInfo } from '@/lib/audit';

export const dynamic = 'force-dynamic';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';

    // Aplicar los mismos filtros que en la consulta normal
    const filters: any = {};
    
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

    const logs = await prisma.auditLog.findMany({
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
      const csvRows = logs.map(log => {
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
      const auditLogger = new AuditLogger(prisma);
      const requestInfo = extractRequestInfo(request);
      await auditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
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
