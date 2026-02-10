
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WebhooksService } from '@/lib/webhooks';

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        const result = await WebhooksService.testEndpoint(session.user.tenantId, params.id);

        return NextResponse.json({
            success: result.success,
            statusCode: result.statusCode,
            error: result.error,
            duration: result.duration
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error al probar el webhook' }, { status: 500 });
    }
}
