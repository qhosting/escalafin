
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { ReviewCreditApplicationData } from '@/lib/api/credit-applications';
import { UserRole, ApplicationStatus, LoanStatus } from '@prisma/client';

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'Solo los administradores pueden revisar solicitudes de crédito' },
        { status: 401 }
      );
    }

    const data: ReviewCreditApplicationData = await request.json();

    // Validation
    if (!data.status) {
      return NextResponse.json(
        { error: 'El estado es requerido' },
        { status: 400 }
      );
    }

    if (data.status === ApplicationStatus.APPROVED) {
      if (!data.approvedAmount || !data.approvedTerm || !data.interestRate) {
        return NextResponse.json(
          { error: 'Para aprobar se requiere monto, plazo y tasa de interés' },
          { status: 400 }
        );
      }

      if (data.approvedAmount <= 0) {
        return NextResponse.json(
          { error: 'El monto aprobado debe ser mayor a 0' },
          { status: 400 }
        );
      }

      if (data.approvedTerm <= 0 || data.approvedTerm > 360) {
        return NextResponse.json(
          { error: 'El plazo debe estar entre 1 y 360 meses' },
          { status: 400 }
        );
      }

      if (data.interestRate <= 0 || data.interestRate > 1) {
        return NextResponse.json(
          { error: 'La tasa de interés debe estar entre 0 y 1 (100%)' },
          { status: 400 }
        );
      }
    }

    const creditApplication = await prisma.creditApplication.findUnique({
      where: { id: params.id },
      include: {
        client: true,
        loan: true,
      },
    });

    if (!creditApplication) {
      return NextResponse.json(
        { error: 'Solicitud de crédito no encontrada' },
        { status: 404 }
      );
    }

    // Cannot review already processed applications
    if (creditApplication.status !== ApplicationStatus.PENDING && 
        creditApplication.status !== ApplicationStatus.UNDER_REVIEW) {
      return NextResponse.json(
        { error: 'Esta solicitud ya ha sido procesada' },
        { status: 400 }
      );
    }

    // Start transaction
    const result = await prisma.$transaction(async (tx: any) => {
      // Update credit application
      const updatedApplication = await tx.creditApplication.update({
        where: { id: params.id },
        data: {
          status: data.status,
          reviewedBy: session.user.id,
          reviewedAt: new Date(),
          reviewComments: data.reviewComments,
          approvedAmount: data.approvedAmount,
          approvedTerm: data.approvedTerm,
          interestRate: data.interestRate,
          updatedAt: new Date(),
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
              monthlyIncome: true,
              creditScore: true,
            },
          },
          createdBy: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          reviewedByUser: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: session.user.id,
          userEmail: session.user.email!,
          action: 'REVIEW_CREDIT_APPLICATION',
          resource: 'CreditApplication',
          resourceId: params.id,
          details: JSON.stringify({
            status: data.status,
            reviewComments: data.reviewComments,
            approvedAmount: data.approvedAmount,
            approvedTerm: data.approvedTerm,
            interestRate: data.interestRate,
          }),
          ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
          userAgent: request.headers.get('user-agent') || 'unknown',
        },
      });

      // If approved, create the loan
      if (data.status === ApplicationStatus.APPROVED && data.approvedAmount && data.approvedTerm && data.interestRate) {
        // Generate loan number
        const loanCount = await tx.loan.count();
        const loanNumber = `LOAN-${new Date().getFullYear()}-${String(loanCount + 1).padStart(6, '0')}`;

        // Calculate financial details
        const monthlyRate = data.interestRate / 12;
        const monthlyPayment = (data.approvedAmount * monthlyRate * Math.pow(1 + monthlyRate, data.approvedTerm)) /
                              (Math.pow(1 + monthlyRate, data.approvedTerm) - 1);
        const totalAmount = monthlyPayment * data.approvedTerm;

        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + data.approvedTerm);

        // Create loan
        const loan = await tx.loan.create({
          data: {
            clientId: creditApplication.clientId,
            creditApplicationId: params.id,
            loanNumber,
            loanType: creditApplication.loanType,
            principalAmount: data.approvedAmount,
            interestRate: data.interestRate,
            termMonths: data.approvedTerm,
            monthlyPayment,
            totalAmount,
            balanceRemaining: data.approvedAmount,
            status: LoanStatus.ACTIVE,
            startDate,
            endDate,
          },
        });

        // Create amortization schedule
        let balance = data.approvedAmount;
        const amortizationData = [];

        for (let paymentNumber = 1; paymentNumber <= data.approvedTerm; paymentNumber++) {
          const interestPayment = balance * monthlyRate;
          const principalPayment = monthlyPayment - interestPayment;
          balance = Math.max(0, balance - principalPayment);

          const paymentDate = new Date(startDate);
          paymentDate.setMonth(paymentDate.getMonth() + paymentNumber);

          amortizationData.push({
            loanId: loan.id,
            paymentNumber,
            paymentDate,
            principalPayment,
            interestPayment,
            totalPayment: monthlyPayment,
            remainingBalance: balance,
            isPaid: false,
          });
        }

        // Insert amortization schedule in batches
        await tx.amortizationSchedule.createMany({
          data: amortizationData,
        });

        // Create notification for client
        if (creditApplication.client.userId) {
          await tx.notification.create({
            data: {
              userId: creditApplication.client.userId,
              type: 'LOAN_APPROVED',
              channel: 'IN_APP',
              title: 'Préstamo Aprobado',
              message: `Tu solicitud de préstamo por $${data.approvedAmount.toLocaleString()} ha sido aprobada. El préstamo ${loanNumber} está ahora activo.`,
              data: JSON.stringify({
                loanId: loan.id,
                loanNumber,
                approvedAmount: data.approvedAmount,
              }),
            },
          });
        }
      } else if (data.status === ApplicationStatus.REJECTED) {
        // Create notification for client
        if (creditApplication.client.userId) {
          await tx.notification.create({
            data: {
              userId: creditApplication.client.userId,
              type: 'LOAN_REJECTED',
              channel: 'IN_APP',
              title: 'Solicitud Rechazada',
              message: `Tu solicitud de crédito ha sido rechazada. ${data.reviewComments || 'Contacta a tu asesor para más información.'}`,
              data: JSON.stringify({
                applicationId: params.id,
                reviewComments: data.reviewComments,
              }),
            },
          });
        }
      }

      return updatedApplication;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error reviewing credit application:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
