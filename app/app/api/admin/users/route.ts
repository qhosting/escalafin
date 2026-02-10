
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { LimitsService } from '@/lib/billing/limits';
import { UsageTracker } from '@/lib/billing/usage-tracker';

// Test simple endpoint
export async function GET(request: NextRequest) {
  console.log('🔍 Admin users endpoint called');

  try {
    // First test without auth to see if we can reach the endpoint
    console.log('📡 Testing basic endpoint functionality');

    // Simple test - return basic info
    const testResponse = {
      message: 'Admin users endpoint is working',
      timestamp: new Date().toISOString(),
      path: '/api/admin/users'
    };

    console.log('✅ Basic endpoint test successful');

    // Now try auth
    const session = await getServerSession(authOptions);
    console.log('🔐 Session check:', !!session);

    if (!session?.user) {
      console.log('❌ No session found');
      return NextResponse.json({
        error: 'No autorizado - se requiere autenticación',
        ...testResponse
      }, { status: 401 });
    }

    if (session.user.role !== UserRole.ADMIN) {
      console.log('❌ Not admin role:', session.user.role);
      return NextResponse.json({
        error: 'No autorizado - se requiere rol de administrador',
        currentRole: session.user.role,
        ...testResponse
      }, { status: 403 });
    }

    console.log('🔍 Fetching users from database...');
    const users = await prisma.user.findMany({
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
        createdAt: true,
        _count: {
          select: {
            clientsAssigned: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(`✅ Retrieved ${users.length} users successfully`);
    return NextResponse.json({
      users,
      count: users.length,
      ...testResponse
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json(
      {
        error: 'Error al cargar usuarios',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const tenantId = session.user.tenantId;

    // 💡 Verificación de Límites SaaS
    const limitError = await LimitsService.middleware(tenantId || '', 'users');
    if (limitError) return limitError;

    const body = await request.json();
    const { firstName, lastName, email, phone, role, password } = body;

    // Validations
    if (!firstName || !lastName || !email || !password || !role) {
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

    // Create user
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        role: role as UserRole,
        password: hashedPassword,
        status: 'ACTIVE',
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

    // 📈 Incrementar uso en SaaS
    if (tenantId) {
      await UsageTracker.incrementUsage(tenantId, 'usersCount');
    }

    return NextResponse.json({
      success: true,
      user,
      message: 'Usuario creado exitosamente'
    });

  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Error al crear usuario' },
      { status: 500 }
    );
  }
}
