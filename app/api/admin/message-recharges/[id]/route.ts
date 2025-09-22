
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// PATCH: Actualizar estado de recarga
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const { status, paymentReference, processedAt } = body;

    // Verificar que la recarga existe
    const existingRecharge = await prisma.messageRecharge.findUnique({
      where: { id },
      include: {
        client: true
      }
    });

    if (!existingRecharge) {
      return NextResponse.json(
        { error: 'Recarga no encontrada' },
        { status: 404 }
      );
    }

    const updateData: any = {
      status,
      updatedAt: new Date()
    };

    if (paymentReference) {
      updateData.paymentReference = paymentReference;
    }

    if (processedAt) {
      updateData.processedAt = new Date(processedAt);
    }

    // Si se marca como completada, agregar mensajes al cliente
    if (status === 'COMPLETED' && existingRecharge.status !== 'COMPLETED') {
      // Aquí podrías agregar lógica para incrementar el balance de mensajes del cliente
      // Por ejemplo, agregando un campo messageBalance en el modelo Client
    }

    const updatedRecharge = await prisma.messageRecharge.update({
      where: { id },
      data: updateData,
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        }
      }
    });

    return NextResponse.json(updatedRecharge);

  } catch (error) {
    console.error('Error actualizando recarga:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar recarga
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;

    // Verificar que la recarga existe y está en estado que permite eliminación
    const existingRecharge = await prisma.messageRecharge.findUnique({
      where: { id }
    });

    if (!existingRecharge) {
      return NextResponse.json(
        { error: 'Recarga no encontrada' },
        { status: 404 }
      );
    }

    if (existingRecharge.status === 'COMPLETED') {
      return NextResponse.json(
        { error: 'No se puede eliminar una recarga completada' },
        { status: 400 }
      );
    }

    await prisma.messageRecharge.delete({
      where: { id }
    });

    return NextResponse.json({ message: 'Recarga eliminada correctamente' });

  } catch (error) {
    console.error('Error eliminando recarga:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
