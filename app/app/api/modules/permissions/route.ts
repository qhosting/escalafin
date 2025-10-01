
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.role) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Obtener todos los módulos con sus permisos por rol
    const modules = await prisma.pWAModule.findMany({
      include: {
        rolePermissions: {
          where: {
            role: session.user.role as any,
          },
        },
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });

    // Transformar los datos para incluir solo los permisos del rol actual
    const modulesWithPermissions = modules.map(module => ({
      ...module,
      rolePermissions: module.rolePermissions.map(rp => ({
        role: rp.role,
        enabled: rp.enabled,
        permissions: rp.permissions ? JSON.parse(rp.permissions) : [],
        config: rp.config ? JSON.parse(rp.config) : null,
      })),
    }));

    return NextResponse.json({
      modules: modulesWithPermissions,
    });
  } catch (error) {
    console.error('Error fetching modules:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
