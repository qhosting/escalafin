export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import bcrypt from 'bcryptjs';

/**
 * Super Admin: List all users for a specific tenant
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const tenantId = params.id;

        // Verify tenant exists
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, name: true, slug: true }
        });

        if (!tenant) {
            return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
        }

        const users = await prisma.user.findMany({
            where: { tenantId },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
                updatedAt: true,
                twoFactorEnabled: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json({ tenant, users });
    } catch (error) {
        console.error('Error fetching tenant users:', error);
        return NextResponse.json(
            { error: 'Error al obtener usuarios del tenant' },
            { status: 500 }
        );
    }
}

/**
 * Super Admin: Create a new user for a specific tenant
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const tenantId = params.id;

        // Verify tenant exists
        const tenant = await prisma.tenant.findUnique({ where: { id: tenantId } });
        if (!tenant) {
            return NextResponse.json({ error: 'Tenant no encontrado' }, { status: 404 });
        }

        const body = await request.json();
        const { email, password, firstName, lastName, phone, role } = body;

        if (!email || !password || !firstName || !lastName) {
            return NextResponse.json(
                { error: 'Email, contraseña, nombre y apellido son requeridos' },
                { status: 400 }
            );
        }

        // Check if email already exists globally
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return NextResponse.json(
                { error: 'El email ya está registrado en el sistema' },
                { status: 400 }
            );
        }

        const validRoles = ['ADMIN', 'ASESOR', 'CLIENTE'];
        if (role && !validRoles.includes(role)) {
            return NextResponse.json(
                { error: `Rol inválido. Roles permitidos: ${validRoles.join(', ')}` },
                { status: 400 }
            );
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                firstName,
                lastName,
                phone: phone || null,
                role: role || 'ADMIN',
                status: 'ACTIVE',
                tenantId,
            },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            }
        });

        return NextResponse.json(user, { status: 201 });
    } catch (error) {
        console.error('Error creating tenant user:', error);
        return NextResponse.json(
            { error: 'Error al crear usuario' },
            { status: 500 }
        );
    }
}

/**
 * Super Admin: Update a user's role or status within a tenant
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const tenantId = params.id;
        const body = await request.json();
        const { userId, role, status, password, firstName, lastName, phone } = body;

        if (!userId) {
            return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
        }

        // Verify user belongs to this tenant
        const user = await prisma.user.findFirst({
            where: { id: userId, tenantId }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Usuario no encontrado en este tenant' },
                { status: 404 }
            );
        }

        const updateData: any = {};
        if (role) updateData.role = role;
        if (status) updateData.status = status;
        if (firstName) updateData.firstName = firstName;
        if (lastName) updateData.lastName = lastName;
        if (phone !== undefined) updateData.phone = phone;
        if (password) updateData.password = await bcrypt.hash(password, 10);

        const updated = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
                role: true,
                status: true,
            }
        });

        return NextResponse.json(updated);
    } catch (error) {
        console.error('Error updating tenant user:', error);
        return NextResponse.json(
            { error: 'Error al actualizar usuario' },
            { status: 500 }
        );
    }
}

/**
 * Super Admin: Delete a user from a tenant
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const tenantId = params.id;
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'userId es requerido' }, { status: 400 });
        }

        // Verify user belongs to this tenant
        const user = await prisma.user.findFirst({
            where: { id: userId, tenantId }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Usuario no encontrado en este tenant' },
                { status: 404 }
            );
        }

        await prisma.user.delete({ where: { id: userId } });

        return NextResponse.json({ message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error deleting tenant user:', error);
        return NextResponse.json(
            { error: 'Error al eliminar usuario' },
            { status: 500 }
        );
    }
}
