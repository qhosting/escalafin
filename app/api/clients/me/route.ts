
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/clients/me
 * Obtiene la información del cliente actual basado en el usuario autenticado
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Buscar el cliente asociado al usuario
    const client = await prisma.client.findUnique({
      where: {
        userId: session.user.id,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
        email: true,
        phone: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      client,
    });

  } catch (error: any) {
    console.error('Error en GET /api/clients/me:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
