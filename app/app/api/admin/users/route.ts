
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { LimitsService } from '@/lib/billing/limits';
import { UsageTracker } from '@/lib/billing/usage-tracker';
import { getTenantPrisma } from '@/lib/tenant-db';
import { AuditLogger } from '@/lib/audit';

// User management API endpoint
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado - se requiere autenticación' },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN) {
      return NextResponse.json(
        { error: 'No autorizado - se requiere rol de administrador' },
        { status: 403 }
      );
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

    const users = await tenantPrisma.user.findMany({
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

    return NextResponse.json({
      users,
      count: users.length,
    });
  } catch (error) {
    console.error('❌ Error fetching users:', error);
    return NextResponse.json(
      {
        error: 'Error al cargar usuarios',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== UserRole.ADMIN && session.user.role !== UserRole.SUPER_ADMIN)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const tenantId = session.user.tenantId;
    const tenantPrisma = getTenantPrisma(tenantId);

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
    const existingUser = await tenantPrisma.user.findUnique({
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
    const user = await tenantPrisma.user.create({
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

    // Audit log
    await AuditLogger.quickLog(request, 'USER_CREATE', {
      userEmail: user.email,
      role: user.role
    }, 'User', user.id, session);

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
