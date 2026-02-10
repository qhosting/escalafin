
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                tenant: {
                    select: {
                        name: true,
                        slug: true
                    }
                }
            }
        });

        return NextResponse.json(user);
    } catch (error) {
        return NextResponse.json({ error: 'Error al obtener perfil' }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (!session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { firstName, lastName, phone, currentPassword, newPassword } = body;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id }
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        const data: any = {};
        if (firstName) data.firstName = firstName;
        if (lastName) data.lastName = lastName;
        if (phone) data.phone = phone;

        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Debes proporcionar tu contraseña actual' }, { status: 400 });
            }

            const passwordMatch = await bcrypt.compare(currentPassword, user.password || '');
            if (!passwordMatch) {
                return NextResponse.json({ error: 'La contraseña actual es incorrecta' }, { status: 400 });
            }

            data.password = await bcrypt.hash(newPassword, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id: session.user.id },
            data,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true
            }
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error('Error updating profile:', error);
        return NextResponse.json({ error: 'Error al actualizar perfil' }, { status: 500 });
    }
}
