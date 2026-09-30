import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const rolePermissionUpdateSchema = z.object({
  moduleId: z.string(),
  role: z.enum(['ADMIN', 'ASESOR', 'CLIENTE']),
  enabled: z.boolean(),
  permissions: z.array(z.string()).optional(),
  config: z.any().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { moduleId, role, enabled, permissions, config } = rolePermissionUpdateSchema.parse(body);

    const module = await prisma.pWAModule.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    // Upsert role permission for the module
    const rolePermission = await prisma.pWAModuleRolePermission.upsert({
      where: {
        moduleId_role: {
          moduleId,
          role,
        },
      },
      update: {
        enabled,
        ...(permissions && { permissions: JSON.stringify(permissions) }),
        ...(config && { config: JSON.stringify(config) }),
      },
      create: {
        moduleId,
        role,
        enabled,
        permissions: JSON.stringify(permissions || ['read']),
        config: config ? JSON.stringify(config) : null,
      },
    });

    return NextResponse.json({
      success: true,
      rolePermission: {
        ...rolePermission,
        permissions: rolePermission.permissions ? JSON.parse(rolePermission.permissions) : [],
        config: rolePermission.config ? JSON.parse(rolePermission.config) : null,
      },
    });
  } catch (error) {
    console.error('Error updating role permission:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
