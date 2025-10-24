
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const moduleUpdateSchema = z.object({
  moduleId: z.string(),
  status: z.enum(['ENABLED', 'DISABLED', 'BETA', 'MAINTENANCE']).optional(),
  config: z.any().optional(),
});

const rolePermissionUpdateSchema = z.object({
  moduleId: z.string(),
  role: z.enum(['ADMIN', 'ASESOR', 'CLIENTE']),
  enabled: z.boolean(),
  permissions: z.array(z.string()).optional(),
  config: z.any().optional(),
});

// GET - Obtener todos los módulos (solo admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const modules = await prisma.pWAModule.findMany({
      include: {
        rolePermissions: {
          orderBy: {
            role: 'asc',
          },
        },
        updatedByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [
        { category: 'asc' },
        { sortOrder: 'asc' },
      ],
    });

    // Transform data for response
    const modulesResponse = modules.map(module => ({
      ...module,
      config: module.config ? JSON.parse(module.config) : null,
      rolePermissions: module.rolePermissions.map(rp => ({
        ...rp,
        permissions: rp.permissions ? JSON.parse(rp.permissions) : [],
        config: rp.config ? JSON.parse(rp.config) : null,
      })),
    }));

    return NextResponse.json({ modules: modulesResponse });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// PUT - Actualizar módulo (solo admin)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const body = await request.json();
    const { moduleId, status, config } = moduleUpdateSchema.parse(body);

    // Check if module is core (cannot be disabled)
    const module = await prisma.pWAModule.findUnique({
      where: { id: moduleId },
    });

    if (!module) {
      return NextResponse.json({ error: 'Módulo no encontrado' }, { status: 404 });
    }

    if (module.isCore && status === 'DISABLED') {
      return NextResponse.json(
        { error: 'No se puede deshabilitar un módulo core' },
        { status: 400 }
      );
    }

    // Log the change
    if (status && status !== module.status) {
      await prisma.moduleChangeLog.create({
        data: {
          moduleId,
          action: status === 'ENABLED' ? 'ENABLED' : 'DISABLED',
          oldValue: JSON.stringify({ status: module.status }),
          newValue: JSON.stringify({ status }),
          reason: `Status changed by admin: ${session.user.email}`,
          userId: session.user.id,
        },
      });
    }

    const updatedModule = await prisma.pWAModule.update({
      where: { id: moduleId },
      data: {
        ...(status && { status }),
        ...(config && { config: JSON.stringify(config) }),
        updatedBy: session.user.id,
      },
      include: {
        rolePermissions: true,
        updatedByUser: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return NextResponse.json({ module: updatedModule });
  } catch (error) {
    console.error('Error updating module:', error);
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
