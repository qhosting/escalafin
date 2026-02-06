
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { customReportService } from '@/lib/custom-report-service';
import { applyRateLimit, rateLimiters } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Aplicar rate limiting
        const rateLimit = await applyRateLimit(request, rateLimiters.reports);
        if (rateLimit) return rateLimit;

        const body = await request.json();
        const { templateId, parameters } = body;

        if (!templateId) {
            return NextResponse.json({ error: 'templateId is required' }, { status: 400 });
        }

        const generationId = await customReportService.generateReport(
            templateId,
            session.user.id,
            parameters
        );

        return NextResponse.json({ success: true, generationId });
    } catch (error: any) {
        console.error('Error generating custom report:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
