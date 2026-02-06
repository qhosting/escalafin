
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

/**
 * Endpoint para que Súper Admins inviten a nuevas organizaciones.
 * Genera un token único y lo guarda en la base de datos.
 */
export async function POST(request: NextRequest) {
    try {
        // 1. Verificar sesión y rol de Súper Admin
        const session = await getServerSession(authOptions);

        // Asumimos que el rol es SUPER_ADMIN para permitir esta acción
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { email, orgName } = await request.json();

        if (!email) {
            return NextResponse.json({ error: 'El email es requerido' }, { status: 400 });
        }

        // 2. Generar token único
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // Expira en 7 días

        // 3. Crear la invitación
        const invitation = await prisma.tenantInvitation.create({
            data: {
                email: email.toLowerCase(),
                orgName,
                token,
                expiresAt,
                invitedBy: session.user.id,
                status: 'PENDING'
            }
        });

        // 4. En un sistema real aquí se enviaría un correo
        // Por ahora solo retornamos el link
        const inviteLink = `${process.env.NEXTAUTH_URL}/auth/register-tenant?token=${token}`;

        return NextResponse.json({
            message: 'Invitación creada exitosamente',
            invitation: {
                id: invitation.id,
                email: invitation.email,
                token: invitation.token,
                inviteLink
            }
        }, { status: 201 });

    } catch (error) {
        console.error('Error creando invitación:', error);
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}

/**
 * Lista invitaciones (opcional)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const invitations = await prisma.tenantInvitation.findMany({
            orderBy: { createdAt: 'desc' },
            include: {
                inviter: {
                    select: { firstName: true, lastName: true, email: true }
                }
            }
        });

        return NextResponse.json(invitations);
    } catch (error) {
        return NextResponse.json({ error: 'Error interno' }, { status: 500 });
    }
}
