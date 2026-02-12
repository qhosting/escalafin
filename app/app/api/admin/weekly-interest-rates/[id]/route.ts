
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/weekly-interest-rates/[id]
 * Obtiene una tasa de interés semanal específica
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const rate = await prisma.weeklyInterestRate.findUnique({
      where: { id: params.id }
    });

    if (!rate) {
      return NextResponse.json(
        { error: 'Tasa de interés no encontrada' },
        { status: 404 }
      );
    }

    return NextResponse.json(rate);
  } catch (error) {
    console.error('Error al obtener tasa de interés semanal:', error);
    return NextResponse.json(
      { error: 'Error al obtener tasa de interés semanal' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/weekly-interest-rates/[id]
 * Actualiza una tasa de interés semanal (solo ADMIN)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para actualizar tasas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { minAmount, maxAmount, weeklyInterestRate, weeklyInterestAmount, isActive } = body;

    // Verificar que la tasa existe
    const existingRate = await prisma.weeklyInterestRate.findUnique({
      where: { id: params.id }
    });

    if (!existingRate) {
      return NextResponse.json(
        { error: 'Tasa de interés no encontrada' },
        { status: 404 }
      );
    }

    // Validaciones si se actualizan los montos
    if (minAmount !== undefined && maxAmount !== undefined) {
      if (parseFloat(minAmount) > parseFloat(maxAmount)) {
        return NextResponse.json(
          { error: 'El monto mínimo no puede ser mayor al monto máximo' },
          { status: 400 }
        );
      }

      // Verificar solapamiento con otras tasas (excluyendo la actual)
      const overlapping = await prisma.weeklyInterestRate.findFirst({
        where: {
          id: { not: params.id },
          OR: [
            {
              AND: [
                { minAmount: { lte: parseFloat(minAmount) } },
                { maxAmount: { gte: parseFloat(minAmount) } }
              ]
            },
            {
              AND: [
                { minAmount: { lte: parseFloat(maxAmount) } },
                { maxAmount: { gte: parseFloat(maxAmount) } }
              ]
            }
          ]
        }
      });

      if (overlapping) {
        return NextResponse.json(
          { error: 'Ya existe una tasa configurada para este rango de montos' },
          { status: 400 }
        );
      }
    }

    const updatedRate = await prisma.weeklyInterestRate.update({
      where: { id: params.id },
      data: {
        ...(minAmount !== undefined && { minAmount: parseFloat(minAmount) }),
        ...(maxAmount !== undefined && { maxAmount: parseFloat(maxAmount) }),
        ...(weeklyInterestRate !== undefined && { weeklyInterestRate: parseFloat(weeklyInterestRate) }),
        ...(weeklyInterestAmount !== undefined && { weeklyInterestAmount: parseFloat(weeklyInterestAmount) }),
        ...(isActive !== undefined && { isActive })
      }
    });

    return NextResponse.json(updatedRate);
  } catch (error) {
    console.error('Error al actualizar tasa de interés semanal:', error);
    return NextResponse.json(
      { error: 'Error al actualizar tasa de interés semanal' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/weekly-interest-rates/[id]
 * Elimina una tasa de interés semanal (solo ADMIN)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para eliminar tasas' },
        { status: 403 }
      );
    }

    // Verificar que la tasa existe
    const existingRate = await prisma.weeklyInterestRate.findUnique({
      where: { id: params.id }
    });

    if (!existingRate) {
      return NextResponse.json(
        { error: 'Tasa de interés no encontrada' },
        { status: 404 }
      );
    }

    await prisma.weeklyInterestRate.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: 'Tasa de interés eliminada correctamente' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error al eliminar tasa de interés semanal:', error);
    return NextResponse.json(
      { error: 'Error al eliminar tasa de interés semanal' },
      { status: 500 }
    );
  }
}
