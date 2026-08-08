/**
 * Endpoint de API Pública v1 - Préstamos (/api/v1/loans)
 * EscalaFin v3.0.0 - Producción
 * 
 * Permite consultar la cartera de préstamos y consultar detalle de amortización
 * mediante autenticación segura por API Key (Bearer Token / Header X-API-Key).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateApiKey } from '@/lib/api-keys';

export async function GET(req: NextRequest) {
  try {
    const apiKey = req.headers.get('x-api-key') || req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere cabecera X-API-Key o Authorization Bearer.' },
        { status: 401 }
      );
    }

    const keyValidation = await validateApiKey(apiKey);
    if (!keyValidation.isValid || !keyValidation.tenantId) {
      return NextResponse.json(
        { error: 'API Key inválida o revocada.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'ACTIVE';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20', 10), 100);

    const [loans, total] = await Promise.all([
      prisma.loan.findMany({
        where: {
          tenantId: keyValidation.tenantId,
          ...(status ? { status: status as any } : {}),
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              email: true,
            },
          },
          amortizationSchedule: {
            orderBy: { paymentNumber: 'asc' },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loan.count({
        where: {
          tenantId: keyValidation.tenantId,
          ...(status ? { status: status as any } : {}),
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: loans.map((loan) => ({
        id: loan.id,
        amount: Number(loan.amount),
        interestRate: Number(loan.interestRate),
        termMonths: loan.termMonths,
        paymentFrequency: loan.paymentFrequency,
        status: loan.status,
        startDate: loan.startDate,
        client: {
          id: loan.client.id,
          name: `${loan.client.firstName} ${loan.client.lastName}`,
          phone: loan.client.phone,
          email: loan.client.email,
        },
        amortization: loan.amortizationSchedule.map((item) => ({
          paymentNumber: item.paymentNumber,
          paymentDate: item.paymentDate,
          amount: Number(item.totalPayment),
          principal: Number(item.principalAmount),
          interest: Number(item.interestAmount),
          isPaid: item.isPaid,
          paidAt: item.paidAt,
        })),
      })),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Error en API v1 préstamos:', error);
    return NextResponse.json(
      { error: 'Error interno en el servidor', details: error?.message },
      { status: 500 }
    );
  }
}
