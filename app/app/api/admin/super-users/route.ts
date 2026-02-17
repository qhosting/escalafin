
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

console.log('🚀 API Route /api/admin/super-users LOADED');

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const users = await prisma.user.findMany({
            where: {
                role: UserRole.SUPER_ADMIN
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json({
            users,
            count: users.length
        });
    } catch (error) {
        console.error('Error fetching super users:', error);
        return NextResponse.json(
            { error: 'Error al cargar super usuarios' },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user || session.user.role !== UserRole.SUPER_ADMIN) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await request.json();
        const { firstName, lastName, email, phone, password } = body;

        // Validations
        if (!firstName || !lastName || !email || !password) {
            return NextResponse.json(
                { error: 'Todos los campos obligatorios deben ser completados' },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { error: 'La contraseña debe tener al menos 6 caracteres' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Ya existe un usuario con este email' },
                { status: 400 }
            );
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user without tenantId (Global Super Admin)
        const user = await prisma.user.create({
            data: {
                firstName,
                lastName,
                email,
                phone: phone || null,
                role: UserRole.SUPER_ADMIN,
                password: hashedPassword,
                status: 'ACTIVE',
                tenantId: null // Explicitly null for global super admin
            },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
                role: true,
                status: true,
                createdAt: true,
            },
        });

        return NextResponse.json({
            success: true,
            user,
            message: 'Super Admin creado exitosamente'
        });

    } catch (error) {
        console.error('Error creating super admin:', error);
        return NextResponse.json(
            { error: 'Error al crear super admin' },
            { status: 500 }
        );
    }
}
