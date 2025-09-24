
import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Endpoint público para registro de CLIENTES únicamente
// Los administradores y asesores se crean desde el panel de administración
export async function POST(request: NextRequest) {
  try {
    // Verificar si el registro está habilitado
    const registrationConfig = await prisma.systemConfig.findUnique({
      where: { key: 'REGISTRATION_ENABLED' }
    });

    const isRegistrationEnabled = registrationConfig?.value === 'true';
    
    if (!isRegistrationEnabled) {
      return NextResponse.json(
        { error: 'El registro de nuevos usuarios está temporalmente deshabilitado. Contacta al administrador.' },
        { status: 403 }
      );
    }

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

    // El registro público solo permite CLIENTE
    const userRole = 'CLIENTE';
    
    if (role && role.toUpperCase() !== 'CLIENTE') {
      return NextResponse.json(
        { error: 'El registro público solo está disponible para clientes. Los administradores y asesores se crean desde el panel de administración.' },
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
        role: 'CLIENTE',
        status: 'ACTIVE',
      },
    });

    // Siempre crear el perfil de cliente ya que el registro público es solo para clientes
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
