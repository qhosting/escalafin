/**
 * Health Check Endpoints
 * 
 * GET /api/health - Full health check
 * GET /api/health/liveness - Kubernetes liveness probe
 * GET /api/health/readiness - Kubernetes readiness probe
 * GET /api/health/metrics - System metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { healthCheck } from '@/lib/health-check';

export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const check = searchParams.get('check');

    try {
        // Liveness probe
        if (check === 'liveness') {
            const isAlive = await healthCheck.liveness();
            return NextResponse.json(
                { status: isAlive ? 'ok' : 'error' },
                { status: isAlive ? 200 : 503 }
            );
        }

        // Readiness probe
        if (check === 'readiness') {
            const isReady = await healthCheck.readiness();
            return NextResponse.json(
                { status: isReady ? 'ready' : 'not ready' },
                { status: isReady ? 200 : 503 }
            );
        }

        // Metrics
        if (check === 'metrics') {
            const metrics = await healthCheck.metrics();
            return NextResponse.json(metrics);
        }

        // Full health check
        const result = await healthCheck.check();
        const status = result.status === 'healthy' ? 200 :
            result.status === 'degraded' ? 200 : 503;

        return NextResponse.json(result, { status });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'unhealthy',
                error: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 503 }
        );
    }
}
