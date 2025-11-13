
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

/**
 * GET /api/admin/weekly-interest-rates/find-for-amount?amount=5000
 * Busca la tasa de interés semanal correspondiente a un monto
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const amountStr = searchParams.get('amount');

    if (!amountStr) {
      return NextResponse.json(
        { error: 'Se requiere el parámetro "amount"' },
        { status: 400 }
      );
    }

    const amount = parseFloat(amountStr);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: 'El monto debe ser un número válido mayor a 0' },
        { status: 400 }
      );
    }

    // Buscar la tasa correspondiente al monto
    const rate = await prisma.weeklyInterestRate.findFirst({
      where: {
        isActive: true,
        minAmount: { lte: amount },
        maxAmount: { gte: amount }
      }
    });

    if (!rate) {
      // Si no se encuentra tasa exacta, buscar la más cercana o calcular
      const nearestRate = await prisma.weeklyInterestRate.findFirst({
        where: {
          isActive: true,
          minAmount: { lte: amount }
        },
        orderBy: {
          maxAmount: 'desc'
        }
      });

      if (nearestRate) {
        // Calcular tasa proporcional basada en la más cercana
        const ratio = amount / parseFloat(nearestRate.maxAmount.toString());
        const calculatedWeeklyAmount = parseFloat(nearestRate.weeklyInterestAmount.toString()) * ratio;
        const calculatedRate = (calculatedWeeklyAmount / amount) * 100;

        return NextResponse.json({
          isCalculated: true,
          minAmount: amount,
          maxAmount: amount,
          weeklyInterestAmount: Math.round(calculatedWeeklyAmount * 100) / 100,
          weeklyInterestRate: Math.round(calculatedRate * 100) / 100,
          baseRate: nearestRate
        });
      }

      return NextResponse.json(
        { error: 'No se encontró una tasa configurada para este monto' },
        { status: 404 }
      );
    }

    return NextResponse.json(rate);
  } catch (error) {
    console.error('Error al buscar tasa de interés semanal:', error);
    return NextResponse.json(
      { error: 'Error al buscar tasa de interés semanal' },
      { status: 500 }
    );
  }
}
