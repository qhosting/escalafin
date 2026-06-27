/**
 * app/api/pld/screening/route.ts
 *
 * Endpoint interno para disparar el screening OFAC/ONU de un cliente.
 * Invocado durante el proceso de alta de clientes (onboarding).
 *
 * POST /api/pld/screening
 * Body: { clientId: string }
 *
 * Requiere autenticación y rol ADMIN o ASESOR.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession }          from 'next-auth';
import { authOptions }               from '@/lib/auth';
import { prisma }                    from '@/lib/prisma';
import PldScreeningService           from '@/lib/pld-screening';
import PldRiskScoringService         from '@/lib/pld-risk-scoring';
import { AuditLogger }               from '@/lib/audit';

export async function POST(request: NextRequest) {
  try {
    // ── Autenticación ──────────────────────────────────────────────────────
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN', 'ASESOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await request.json();
    const { clientId } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'clientId es requerido' }, { status: 400 });
    }

    // ── Obtener datos del cliente ──────────────────────────────────────────
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 });
    }

    const tenantId = session.user.tenantId ?? client.tenantId ?? '';
    const ipAddress = request.headers.get('x-forwarded-for') ||
                      request.headers.get('x-real-ip') ||
                      'unknown';

    // ── 1. Scoring de riesgo PLD ───────────────────────────────────────────
    const riskScorer = new PldRiskScoringService();
    const age = client.dateOfBirth
      ? Math.floor((Date.now() - new Date(client.dateOfBirth).getTime()) / (365.25 * 24 * 3600 * 1000))
      : 30; // Default si no hay fecha de nacimiento

    const riskResult = await riskScorer.scoreAndPersist(
      clientId,
      {
        age,
        postalCode:      client.postalCode ?? '',
        employmentType:  client.employmentType ?? 'EMPLOYED',
        monthlyIncome:   Number(client.monthlyIncome ?? 0),
      },
      tenantId
    );

    // ── 2. Screening OFAC/ONU ──────────────────────────────────────────────
    const screener       = new PldScreeningService();
    const screeningResult = await screener.screenClient(
      clientId,
      client.firstName,
      client.lastName,
      session.user.id,
      tenantId,
      ipAddress
    );

    // ── 3. Registrar en audit_logs ─────────────────────────────────────────
    const auditLogger = new AuditLogger(prisma as any);
    await auditLogger.log({
      userId:     session.user.id,
      userEmail:  session.user.email,
      tenantId,
      action:     'PLD_SCREENING_TRIGGERED' as any,
      resource:   'Client',
      resourceId: clientId,
      ipAddress,
      userAgent:  request.headers.get('user-agent') ?? 'unknown',
      details: {
        riskScore:       riskResult.score,
        riskLevel:       riskResult.riskLevel,
        recommendation:  riskResult.recommendation,
        ofacMatch:       screeningResult.ofacResult?.isMatch ?? null,
        unMatch:         screeningResult.unResult?.isMatch   ?? null,
        overallMatch:    screeningResult.overallMatch,
        screeningStatus: screeningResult.status,
      },
    });

    // ── Respuesta ──────────────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      clientId,
      riskAssessment: {
        score:          riskResult.score,
        riskLevel:      riskResult.riskLevel,
        recommendation: riskResult.recommendation,
        reason:         riskResult.reason,
        factors:        riskResult.factors,
      },
      screeningResult: {
        status:       screeningResult.status,
        overallMatch: screeningResult.overallMatch,
        ofacMatch:    screeningResult.ofacResult?.isMatch  ?? null,
        unMatch:      screeningResult.unResult?.isMatch    ?? null,
        clientBlocked: screeningResult.overallMatch,
      },
    });

  } catch (error) {
    console.error('[PLD-SCREENING-API] Error:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: String(error) },
      { status: 500 }
    );
  }
}

/** GET — Obtener los resultados de screening de un cliente específico */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (!['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json({ error: 'clientId es requerido' }, { status: 400 });
    }

    const screenings = await prisma.pldScreeningResult.findMany({
      where:   { clientId },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ screenings });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
