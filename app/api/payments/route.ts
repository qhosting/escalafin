

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, PaymentStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const loanId = searchParams.get('loanId');
    const clientId = searchParams.get('clientId');

    const skip = (page - 1) * limit;

    // Build where clause based on user role
    const where: any = {};
    
    // If user is CLIENTE, show only their payments
    if (session.user.role === UserRole.CLIENTE) {
      // Get client profile
      const clientProfile = await prisma.client.findUnique({
        where: { userId: session.user.id },
        select: { id: true }
      });
      
      if (clientProfile) {
        where.loan = {
          clientId: clientProfile.id
        };
      } else {
        // If no client profile, return empty array
        return NextResponse.json([]);
      }
    }
    
    // Filter by loanId if provided
    if (loanId) {
      where.loanId = loanId;
    }
    
    // Filter by clientId if provided (only for ADMIN/ASESOR)
    if (clientId && session.user.role !== UserRole.CLIENTE) {
      where.loan = {
        clientId
      };
    }
    
    // Filter by status if provided
    if (status) {
      where.status = status as PaymentStatus;
    }

    // Count total records
    const totalCount = await prisma.payment.count({ where });
    const totalPages = Math.ceil(totalCount / limit);

    // Get payments with related data
    const payments = await prisma.payment.findMany({
      where,
      include: {
        loan: {
          select: {
            id: true,
            loanNumber: true,
            loanType: true,
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true
              }
            }
          }
        },
        amortizationSchedule: {
          select: {
            paymentNumber: true,
            paymentDate: true
          }
        },
        processedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: [
        { paymentDate: 'desc' }
      ],
      skip,
      take: limit
    });

    // Format response
    const formattedPayments = payments.map((payment: any) => ({
      id: payment.id,
      amount: Number(payment.amount),
      paymentDate: payment.paymentDate,
      dueDate: payment.amortizationSchedule?.paymentDate || payment.paymentDate,
      status: payment.status,
      loanId: payment.loanId,
      loanDescription: `${payment.loan.loanType} - ${payment.loan.loanNumber}`,
      loanNumber: payment.loan.loanNumber,
      reference: payment.reference,
      paymentMethod: payment.paymentMethod,
      notes: payment.notes,
      client: payment.loan.client ? {
        id: payment.loan.client.id,
        name: `${payment.loan.client.firstName} ${payment.loan.client.lastName}`,
        phone: payment.loan.client.phone
      } : null,
      processedBy: payment.processedByUser ? {
        id: payment.processedByUser.id,
        name: `${payment.processedByUser.firstName} ${payment.processedByUser.lastName}`
      } : null,
      paymentNumber: payment.amortizationSchedule?.paymentNumber
    }));

    return NextResponse.json({
      payments: formattedPayments,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error fetching payments:', error);
    return NextResponse.json(
      { error: 'Error al cargar pagos' },
      { status: 500 }
    );
  }
}
