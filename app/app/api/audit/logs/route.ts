export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { prisma } from '@/lib/db'; // Usar prisma global

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
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    const filters: any = {};

    // Determine scope
    let dbClient = prisma; // Default to global client

    if (session.user.role === 'SUPER_ADMIN') {
      // Super admin can see all or filter by specific tenant
      const tenantIdFilter = searchParams.get('tenantId');
      if (tenantIdFilter) filters.tenantId = tenantIdFilter;
      // Global prisma client is already capable of querying across all tenants via 'tenantId' column
    } else {
      // Regular admin is scoped to their tenant
      const tenantId = session.user.tenantId!;
      filters.tenantId = tenantId;
      // We could also use getTenantPrisma(tenantId) if tenancy is physically separated, 
      // but assuming shared schema with discriminator column for now based on Schema.prisma showing AuditLog having tenantId.
    }

    // Common filters
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const resource = searchParams.get('resource');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');

    if (userId) filters.userId = userId;
    if (action) filters.action = action;
    if (resource) filters.resource = resource;
    if (startDate || endDate) {
      filters.timestamp = {};
      if (startDate) filters.timestamp.gte = new Date(startDate);
      if (endDate) filters.timestamp.lte = new Date(endDate);
    }
    if (search) {
      filters.OR = [
        { action: { contains: search, mode: 'insensitive' } },
        { resource: { contains: search, mode: 'insensitive' } },
        { userEmail: { contains: search, mode: 'insensitive' } },
        // Add tenant name search for super admin? Not direct on this model, usually
      ];
    }

    const [logs, totalCount] = await Promise.all([
      dbClient.auditLog.findMany({
        where: filters,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          tenant: { // Include tenant info for context
            select: {
              name: true,
              slug: true
            }
          }
        },
      }),
      dbClient.auditLog.count({ where: filters }),
    ]);

    // Formatear logs para el frontend
    const formattedLogs = logs.map((log: any) => ({
      ...log,
      user: log.user ? {
        ...log.user,
        name: `${log.user.firstName} ${log.user.lastName}`,
      } : null,
      details: log.details ? JSON.parse(log.details) : null,
      metadata: log.metadata ? JSON.parse(log.metadata) : null,
      tenantName: log.tenant?.name || 'Sistema Global',
    }));

    return NextResponse.json({
      logs: formattedLogs,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Error al obtener logs de auditoría' },
      { status: 500 }
    );
  }
}
