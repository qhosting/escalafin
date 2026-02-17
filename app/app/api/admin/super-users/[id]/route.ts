
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

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
        const { firstName, lastName, email, phone, status, password } = body;

        // Verify target user is indeed a SUPER_ADMIN
        const targetUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        // Prevent modifying non-super-admins from this endpoint
        if (targetUser.role !== UserRole.SUPER_ADMIN) {
            return NextResponse.json({ error: 'Este endpoint es solo para Super Admins' }, { status: 400 });
        }

        const updateData: any = {
            firstName,
            lastName,
            email,
            phone,
            status
        };

        if (password && password.length >= 6) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        // Remove undefined fields
        Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);

        const updatedUser = await prisma.user.update({
            where: { id },
            data: updateData,
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                role: true,
                status: true,
                updatedAt: true
            }
        });

        return NextResponse.json(updatedUser);

    } catch (error) {
        console.error('Error updating super admin:', error);
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

        const targetUser = await prisma.user.findUnique({
            where: { id }
        });

        if (!targetUser) {
            return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
        }

        if (targetUser.role !== UserRole.SUPER_ADMIN) {
            return NextResponse.json({ error: 'Solo se pueden eliminar Super Admins desde aquí' }, { status: 400 });
        }

        await prisma.user.delete({
            where: { id }
        });

        return NextResponse.json({ success: true, message: 'Super Admin eliminado correctamente' });

    } catch (error) {
        console.error('Error deleting super admin:', error);
        return NextResponse.json({ error: 'Error al eliminar usuario' }, { status: 500 });
    }
}
