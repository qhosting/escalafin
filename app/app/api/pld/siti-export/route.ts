/**
 * app/api/pld/siti-export/route.ts
 *
 * Endpoint protegido para generar y descargar el archivo SITI de la CNBV.
 * Solo accesible por ADMIN/SUPER_ADMIN.
 *
 * GET /api/pld/siti-export?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
 *
 * Retorna el archivo de texto estructurado listo para subir al portal SITI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }          from 'next-auth';
import { authOptions }               from '@/lib/auth';
import { prisma }                    from '@/lib/prisma';
import PldAlertsService              from '@/lib/pld-alerts';

export async function GET(request: NextRequest) {
  try {
    // ── Autenticación ──────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Solo administradores pueden exportar reportes SITI' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);

    // Parámetros del período
    const startDateStr = searchParams.get('startDate');
    const endDateStr   = searchParams.get('endDate');

    if (!startDateStr || !endDateStr) {
      return NextResponse.json({
        error: 'startDate y endDate son requeridos (formato: YYYY-MM-DD)',
      }, { status: 400 });
    }

    const startDate = new Date(startDateStr + 'T00:00:00Z');
    const endDate   = new Date(endDateStr   + 'T23:59:59Z');

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: 'Fechas inválidas' }, { status: 400 });
    }

    if (startDate > endDate) {
      return NextResponse.json({ error: 'startDate debe ser anterior a endDate' }, { status: 400 });
    }

    const tenantId = session.user.tenantId ?? '';
    if (!tenantId) {
      return NextResponse.json({ error: 'Tenant no encontrado en la sesión' }, { status: 400 });
    }

    // ── Obtener datos del tenant para el RFC ───────────────────────────────
    const tenant = await prisma.tenant.findUnique({
      where:  { id: tenantId },
      select: { id: true, name: true },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
    }

    // ── Obtener RFC desde SystemConfig ────────────────────────────────────
    const rfcConfig = await prisma.systemConfig.findFirst({
      where: {
        tenantId,
        key:      'ENTITY_RFC',
        isActive: true,
      },
    });

    const entityRfc  = rfcConfig?.value ?? 'RFC_NO_CONFIGURADO';
    const entityName = tenant.name;

    // ── Generar archivo SITI ───────────────────────────────────────────────
    const service = new PldAlertsService(tenantId);
    const { content, filename, recordCount } = await service.generateSitiFile(
      startDate,
      endDate,
      entityRfc,
      entityName
    );

    if (recordCount === 0) {
      return NextResponse.json({
        message: 'No hay alertas pendientes de reporte para el período indicado.',
        period:  `${startDateStr} – ${endDateStr}`,
      }, { status: 200 });
    }

    // ── Retornar archivo para descarga ─────────────────────────────────────
    return new NextResponse(content, {
      status:  200,
      headers: {
        'Content-Type':        'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'X-PLD-Records':       String(recordCount),
        'X-PLD-Period-Start':  startDateStr,
        'X-PLD-Period-End':    endDateStr,
      },
    });

  } catch (error) {
    console.error('[SITI-EXPORT] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    );
  }
}

/**
 * GET /api/pld/siti-export/preview
 * Retorna un resumen JSON de las alertas pendientes sin marcarlas como reportadas.
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const tenantId = session.user.tenantId ?? '';
    const body     = await request.json();
    const { startDate: s, endDate: e } = body;

    const startDate = new Date(s + 'T00:00:00Z');
    const endDate   = new Date(e + 'T23:59:59Z');

    // Preview sin marcar como reportadas
    const alerts = await prisma.pldAlert.findMany({
      where: {
        tenantId,
        reportedToSiti: false,
        status:         { in: ['OPEN', 'UNDER_REVIEW'] },
        createdAt:      { gte: startDate, lte: endDate },
      },
      include: { client: { select: { firstName: true, lastName: true } } },
      orderBy: { createdAt: 'asc' },
    });

    const summary = {
      period:        `${s} – ${e}`,
      totalAlerts:   alerts.length,
      totalAmount:   alerts.reduce((sum, a) => sum + Number(a.amount), 0).toFixed(2),
      byType: alerts.reduce((acc, a) => {
        acc[a.alertType] = (acc[a.alertType] ?? 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      alerts: alerts.map(a => ({
        id:          a.id,
        type:        a.alertType,
        client:      `${a.client.firstName} ${a.client.lastName}`,
        amount:      Number(a.amount).toFixed(2),
        description: a.description,
        createdAt:   a.createdAt.toISOString(),
      })),
    };

    return NextResponse.json(summary);
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
