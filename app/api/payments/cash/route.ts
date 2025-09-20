
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Parse FormData
    const formData = await request.formData();
    const loanId = formData.get('loanId') as string;
    const clientId = formData.get('clientId') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const paymentDate = new Date(formData.get('paymentDate') as string);
    const collectorLocation = formData.get('collectorLocation') as string;
    const notes = formData.get('notes') as string || '';
    const receiptNumber = formData.get('receiptNumber') as string || '';
    const collectionMethod = formData.get('collectionMethod') as string;
    const collectorId = formData.get('collectorId') as string;
    const photoEvidence = formData.get('photoEvidence') as File;

    // Validate required fields
    if (!loanId || !amount || !collectorLocation) {
      return NextResponse.json({ 
        error: 'Campos requeridos: loanId, amount, collectorLocation' 
      }, { status: 400 });
    }

    // Verify loan exists and belongs to client
    const loan = await prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!loan) {
      return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
    }

    if (loan.clientId !== clientId) {
      return NextResponse.json({ 
        error: 'El préstamo no pertenece al cliente especificado' 
      }, { status: 400 });
    }

    // Handle photo upload if provided
    let photoPath = null;
    if (photoEvidence && photoEvidence.size > 0) {
      const bytes = await photoEvidence.arrayBuffer();
      const buffer = Buffer.from(bytes);
      
      // Generate unique filename
      const timestamp = Date.now();
      const filename = `cash_payment_${loanId}_${timestamp}.${photoEvidence.name.split('.').pop()}`;
      const uploadPath = join(process.cwd(), 'public', 'uploads', 'payments', filename);
      
      // Ensure directory exists
      const dir = join(process.cwd(), 'public', 'uploads', 'payments');
      await import('fs').then(fs => {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      });
      
      await writeFile(uploadPath, buffer);
      photoPath = `/uploads/payments/${filename}`;
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        loanId,
        amount,
        paymentDate,
        paymentMethod: 'CASH',
        status: 'COMPLETED',
        reference: receiptNumber || `CASH-${Date.now()}`,
        notes: `${notes}\n\nMétodo de cobranza: ${collectionMethod}\nUbicación: ${collectorLocation}\nFoto: ${photoPath || 'No proporcionada'}`,
        processedBy: collectorId,
      },
      include: {
        loan: {
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
        },
        processedByUser: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      }
    });

    // Update loan balance
    await prisma.loan.update({
      where: { id: loanId },
      data: {
        balanceRemaining: {
          decrement: amount
        }
      }
    });

    // Create collection record
    await prisma.cashCollection.create({
      data: {
        paymentId: payment.id,
        collectorId,
        collectionMethod,
        collectorLocation,
        photoEvidence: photoPath,
        collectionNotes: notes
      }
    });

    // Send WhatsApp notification if configured
    try {
      if (payment.loan.client.phone) {
        const notificationResponse = await fetch('/api/whatsapp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phoneNumber: payment.loan.client.phone,
            message: `✅ PAGO CONFIRMADO\n\nHola ${payment.loan.client.firstName},\n\nHemos recibido tu pago de ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount)} el ${paymentDate.toLocaleDateString('es-MX')}.\n\nRecibido por: ${payment.processedByUser?.firstName} ${payment.processedByUser?.lastName}\n\n¡Gracias por tu puntualidad!\n\nEscalaFin`,
            type: 'payment_confirmation'
          })
        });
        
        if (!notificationResponse.ok) {
          console.warn('Failed to send WhatsApp notification');
        }
      }
    } catch (error) {
      console.error('Error sending WhatsApp notification:', error);
      // Don't fail the payment if notification fails
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount,
        paymentDate: payment.paymentDate,
        reference: payment.reference,
        status: payment.status,
        collectorLocation,
        photoPath,
        loan: {
          loanNumber: payment.loan.loanNumber,
          newBalance: Number(loan.balanceRemaining) - Number(amount)
        },
        client: payment.loan.client,
        collector: payment.processedByUser
      }
    });

  } catch (error) {
    console.error('Error processing cash payment:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const collectorId = searchParams.get('collectorId');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build where clause
    const whereClause: any = {
      paymentMethod: 'CASH',
      status: 'COMPLETED'
    };

    if (collectorId) {
      whereClause.processedBy = collectorId;
    }

    if (dateFrom) {
      whereClause.paymentDate = {
        gte: new Date(dateFrom)
      };
    }

    if (dateTo) {
      whereClause.paymentDate = {
        ...whereClause.paymentDate,
        lte: new Date(dateTo)
      };
    }

    const cashPayments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        loan: {
          include: {
            client: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
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
      orderBy: {
        paymentDate: 'desc'
      }
    });

    // Calculate stats
    const totalAmount = cashPayments.reduce((sum: number, payment: any) => sum + Number(payment.amount), 0);
    const totalPayments = cashPayments.length;

    return NextResponse.json({
      success: true,
      payments: cashPayments,
      stats: {
        totalPayments,
        totalAmount,
        averagePayment: totalPayments > 0 ? totalAmount / totalPayments : 0
      }
    });

  } catch (error) {
    console.error('Error fetching cash payments:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
