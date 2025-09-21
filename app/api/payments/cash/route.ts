
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { uploadFile } from '@/lib/s3';
import { z } from 'zod';

const cashPaymentSchema = z.object({
  loanId: z.string().min(1),
  clientId: z.string().min(1),
  amount: z.number().positive(),
  paymentDate: z.string(),
  collectorLocation: z.string().min(1),
  notes: z.string().optional(),
  receiptNumber: z.string().optional(),
  collectionMethod: z.enum(['home', 'office', 'field']),
  collectorId: z.string().min(1)
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'ADVISOR', 'COLLECTOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    
    // Extract and validate data
    const data = {
      loanId: formData.get('loanId') as string,
      clientId: formData.get('clientId') as string,
      amount: parseFloat(formData.get('amount') as string),
      paymentDate: formData.get('paymentDate') as string,
      collectorLocation: formData.get('collectorLocation') as string,
      notes: formData.get('notes') as string || '',
      receiptNumber: formData.get('receiptNumber') as string || '',
      collectionMethod: formData.get('collectionMethod') as 'home' | 'office' | 'field',
      collectorId: formData.get('collectorId') as string
    };

    const validatedData = cashPaymentSchema.parse(data);
    
    // Handle photo evidence if provided
    const photoFile = formData.get('photoEvidence') as File | null;
    let photoUrl = null;

    if (photoFile && photoFile.size > 0) {
      try {
        const buffer = Buffer.from(await photoFile.arrayBuffer());
        const fileName = `cash-payments/${Date.now()}-${photoFile.name}`;
        photoUrl = await uploadFile(buffer, fileName);
      } catch (uploadError) {
        console.error('Error uploading photo:', uploadError);
        // Continue without photo - don't fail the payment
      }
    }

    // Verify loan exists and is active
    const loan = await prisma.loan.findFirst({
      where: {
        id: validatedData.loanId,
        status: 'ACTIVE'
      }
    });

    if (!loan) {
      return NextResponse.json(
        { error: 'Préstamo no encontrado o inactivo' },
        { status: 404 }
      );
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        amount: validatedData.amount,
        paymentDate: new Date(validatedData.paymentDate),
        paymentMethod: 'CASH',
        status: 'COMPLETED',
        reference: validatedData.receiptNumber || `CASH-${Date.now()}`,
        notes: validatedData.notes,
        loanId: validatedData.loanId,
        processedBy: validatedData.collectorId
      },
      include: {
        loan: {
          include: {
            client: true
          }
        }
      }
    });

    // Calculate new balance
    const newBalance = Number(loan.balanceRemaining) - validatedData.amount;
    const isFullyPaid = newBalance <= 0;

    // Update loan balance
    const updatedLoan = await prisma.loan.update({
      where: {
        id: validatedData.loanId
      },
      data: {
        balanceRemaining: Math.max(0, newBalance),
        status: isFullyPaid ? 'PAID_OFF' : 'ACTIVE'
      }
    });

    // Create transaction record
    await prisma.paymentTransaction.create({
      data: {
        amount: validatedData.amount,
        status: 'COMPLETED',
        provider: 'MANUAL',
        paymentId: payment.id
      }
    });

    // Create cash collection record
    await prisma.cashCollection.create({
      data: {
        paymentId: payment.id,
        collectorId: validatedData.collectorId,
        collectionMethod: validatedData.collectionMethod,
        collectorLocation: validatedData.collectorLocation,
        photoEvidence: photoUrl,
        collectionNotes: validatedData.notes
      }
    });

    return NextResponse.json({
      payment,
      loan: {
        ...updatedLoan,
        newBalance: updatedLoan.balanceRemaining
      },
      message: 'Pago en efectivo registrado exitosamente'
    });

  } catch (error) {
    console.error('Error processing cash payment:', error);
    
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

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'ADVISOR', 'COLLECTOR'].includes(session.user.role || '')) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const collectorId = searchParams.get('collectorId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let whereClause: any = {
      paymentMethod: 'CASH',
      status: 'COMPLETED'
    };

    if (collectorId) {
      whereClause.processedBy = collectorId;
    }

    if (dateFrom && dateTo) {
      const startDate = new Date(dateFrom);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);

      whereClause.paymentDate = {
        gte: startDate,
        lte: endDate
      };
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        loan: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        }
      },
      orderBy: {
        paymentDate: 'desc'
      }
    });

    const stats = {
      totalPayments: payments.length,
      totalAmount: payments.reduce((sum, payment) => sum + Number(payment.amount), 0)
    };

    return NextResponse.json({
      payments,
      stats
    });

  } catch (error) {
    console.error('Error fetching cash payments:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
