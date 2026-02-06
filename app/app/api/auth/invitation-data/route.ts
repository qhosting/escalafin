
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Endpoint público para consultar datos de una invitación
 * USADO por el formulario de registro para precargar datos.
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Token requerido' }, { status: 400 });
        }

        const invitation = await prisma.tenantInvitation.findUnique({
            where: { token },
            select: {
                email: true,
                orgName: true,
                status: true,
                expiresAt: true
            }
        });

        if (!invitation) {
            return NextResponse.json({ error: 'Invitación no encontrada' }, { status: 404 });
        }

        if (invitation.status !== 'PENDING') {
            return NextResponse.json({ error: 'Invitación ya utilizada' }, { status: 400 });
        }

        if (new Date() > invitation.expiresAt) {
            return NextResponse.json({ error: 'Invitación expirada' }, { status: 400 });
        }

        return NextResponse.json(invitation);

    } catch (error) {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
