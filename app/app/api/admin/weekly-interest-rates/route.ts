
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/weekly-interest-rates
 * Obtiene todas las tasas de interés semanales configuradas
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // Obtener todas las tasas, ordenadas por monto mínimo
    const rates = await prisma.weeklyInterestRate.findMany({
      orderBy: {
        minAmount: 'asc'
      }
    });

    return NextResponse.json(rates);
  } catch (error) {
    console.error('Error al obtener tasas de interés semanales:', error);
    return NextResponse.json(
      { error: 'Error al obtener tasas de interés semanales' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/weekly-interest-rates
 * Crea una nueva tasa de interés semanal (solo ADMIN)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No tienes permisos para crear tasas' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { minAmount, maxAmount, weeklyInterestRate, weeklyInterestAmount, isActive } = body;

    // Validaciones
    if (!minAmount || !maxAmount || !weeklyInterestRate || !weeklyInterestAmount) {
      return NextResponse.json(
        { error: 'Todos los campos son requeridos' },
        { status: 400 }
      );
    }

    if (parseFloat(minAmount) > parseFloat(maxAmount)) {
      return NextResponse.json(
        { error: 'El monto mínimo no puede ser mayor al monto máximo' },
        { status: 400 }
      );
    }

    // Verificar solapamiento de rangos
    const overlapping = await prisma.weeklyInterestRate.findFirst({
      where: {
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

    const newRate = await prisma.weeklyInterestRate.create({
      data: {
        minAmount: parseFloat(minAmount),
        maxAmount: parseFloat(maxAmount),
        weeklyInterestRate: parseFloat(weeklyInterestRate),
        weeklyInterestAmount: parseFloat(weeklyInterestAmount),
        isActive: isActive !== undefined ? isActive : true
      }
    });

    return NextResponse.json(newRate, { status: 201 });
  } catch (error) {
    console.error('Error al crear tasa de interés semanal:', error);
    return NextResponse.json(
      { error: 'Error al crear tasa de interés semanal' },
      { status: 500 }
    );
  }
}
