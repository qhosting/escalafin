/**
 * app/api/sentinel/metrics/route.ts
 *
 * Endpoint de métricas para el plugin Sentinel.
 * GET /api/sentinel/metrics
 *
 * Requiere token de autenticación Sentinel (header: X-Sentinel-Token)
 * Configurar SENTINEL_SECRET en variables de entorno.
 */

import { NextRequest, NextResponse } from 'next/server';
import SentinelLogger               from '@/lib/sentinel-logger';

export async function GET(request: NextRequest) {
  // Validar token Sentinel
  const sentinelSecret = process.env.SENTINEL_SECRET;
  const providedToken  = request.headers.get('x-sentinel-token') ||
                         request.headers.get('authorization')?.replace('Bearer ', '');

  if (sentinelSecret && providedToken !== sentinelSecret) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  try {
    const sentinel = new SentinelLogger();
    const metrics  = await sentinel.collectMetrics();

    return NextResponse.json(metrics, {
      headers: {
        'Cache-Control':  'no-store',
        'X-Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[SENTINEL-METRICS] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
