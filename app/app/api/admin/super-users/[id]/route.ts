
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { id } = params;
        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                tenantId: true,
            }
        });

        if (!user) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error) {
        console.error('Error fetching user:', error);
        return NextResponse.json({ error: 'Error al obtener usuario' }, { status: 500 });
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { id } = params;
        const body = await request.json();
        const { firstName, lastName, email, phone, role, status, password } = body;

        // Verify target user exists
        const targetUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // Check email uniqueness if changed
        if (email && email !== targetUser.email) {
            const existing = await prisma.user.findUnique({ where: { email } });
            if (existing) {
                return NextResponse.json({ error: 'El email ya está en uso' }, { status: 409 });
            }
        }

        const updateData: any = {};

        if (firstName !== undefined) updateData.firstName = firstName;
        if (lastName !== undefined) updateData.lastName = lastName;
        if (email !== undefined) updateData.email = email;
        if (phone !== undefined) updateData.phone = phone;
        if (role !== undefined) updateData.role = role;
        if (status !== undefined) updateData.status = status;

        if (password && password.length >= 6) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                updatedAt: true
            }
        });

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Error al actualizar usuario' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const { id } = params;

        // Prevent self-deletion
        if (id === session.user.id) {
            return NextResponse.json({ error: 'No puedes eliminar tu propia cuenta' }, { status: 400 });
        }

        const targetUser = await prisma.user.findUnique({ where: { id } });

        if (!targetUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        await prisma.user.delete({ where: { id } });

        return NextResponse.json({ success: true, message: 'Usuario eliminado correctamente' });

    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
    }
}
