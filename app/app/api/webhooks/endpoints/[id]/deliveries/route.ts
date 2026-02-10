
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { WebhooksService } from '@/lib/webhooks';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20');

        const deliveries = await WebhooksService.getDeliveryHistory(
            session.user.tenantId,
            params.id,
            limit
        );

        return NextResponse.json({
            success: true,
            deliveries: deliveries.map(d => ({
                id: d.id,
                event: d.event,
                statusCode: d.statusCode,
                error: d.error,
                attempts: d.attempts,
                deliveredAt: d.deliveredAt,
                createdAt: d.createdAt
            }))
        });
    } catch (error) {
        return NextResponse.json({ success: false, error: 'Error al obtener historial' }, { status: 500 });
    }
}
