
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, firstName, lastName, phone, role = 'CLIENTE' } = body;

    // Validar campos requeridos
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser completados' },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ya existe un usuario con este email' },
        { status: 400 }
      );
    }

    // Hashear la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Validar rol
    const validRoles = ['ADMIN', 'ASESOR', 'CLIENTE'];
    const userRole = role.toUpperCase();
    
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Rol de usuario inválido' },
        { status: 400 }
      );
    }

    // Crear el usuario
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName,
        lastName,
        phone: phone || null,
        role: userRole as 'ADMIN' | 'ASESOR' | 'CLIENTE',
        status: 'ACTIVE',
      },
    });

    // Si es un cliente, crear también el perfil de cliente
    if (role.toUpperCase() === 'CLIENTE') {
      await prisma.client.create({
        data: {
          userId: user.id,
          firstName,
          lastName,
          email,
          phone: phone || '',
          status: 'ACTIVE',
        },
      });
    }

    return NextResponse.json(
      {
        message: 'Usuario creado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error en signup:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
