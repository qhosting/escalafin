
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Obtener el estado actual del registro
    const config = await prisma.systemConfig.findFirst({
      where: {
        key: 'REGISTRATION_ENABLED'
      }
    });

    const isRegistrationEnabled = config?.value === 'true';

    return NextResponse.json({
      registrationEnabled: isRegistrationEnabled
    });
  } catch (error) {
    console.error('Error getting registration status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado. Solo los administradores pueden modificar esta configuración.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { enabled } = body;

    if (typeof enabled !== 'boolean') {
      return NextResponse.json(
        { error: 'El valor debe ser un booleano' },
        { status: 400 }
      );
    }

    // Actualizar o crear la configuración
    const existingConfig = await prisma.systemConfig.findFirst({
      where: { key: 'REGISTRATION_ENABLED' }
    });

    if (existingConfig) {
      await prisma.systemConfig.update({
        where: { id: existingConfig.id },
        data: {
          value: enabled.toString(),
          updatedAt: new Date(),
          updatedBy: session.user.id
        }
      });
    } else {
      await prisma.systemConfig.create({
        data: {
          key: 'REGISTRATION_ENABLED',
          value: enabled.toString(),
          description: 'Controla si el registro de nuevos usuarios está habilitado',
          category: 'AUTHENTICATION',
          updatedBy: session.user.id,
          tenantId: null
        }
      });
    }

    return NextResponse.json({
      message: `Registro de usuarios ${enabled ? 'habilitado' : 'deshabilitado'} exitosamente`,
      registrationEnabled: enabled
    });
  } catch (error) {
    console.error('Error updating registration status:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
