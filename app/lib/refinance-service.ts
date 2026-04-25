import { PrismaClient, LoanStatus, PaymentMethod, PaymentStatus, LoanCalculationType, PaymentFrequency } from '@prisma/client';
import { getTenantPrisma } from './tenant-db';
import { calculateLoanDetails, generateAmortizationSchedule } from './loan-calculations';

export class RefinanceService {
  private prisma: any;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId = tenantId;
    this.prisma = getTenantPrisma(tenantId);
  }

  /**
   * Refinancia un préstamo existente creando uno nuevo que absorbe el saldo.
   */
  async refinance(params: {
    originalLoanId: string;
    newLoanData: {
      loanType: string;
      principalAmount: number;
      interestRate: number;
      termMonths: number;
      startDate: Date;
      loanCalculationType: LoanCalculationType;
      paymentFrequency: PaymentFrequency;
      weeklyInterestAmount?: number;
      insuranceAmount?: number;
      disbursementFee?: number;
      disbursedAmount?: number;
    };
    settlementAmount: number; // El saldo que se "paga" del préstamo viejo
    notes?: string;
    processedBy?: string;
  }) {
    const { originalLoanId, newLoanData, settlementAmount, notes, processedBy } = params;

    return await this.prisma.$transaction(async (tx: any) => {
      // 1. Obtener préstamo original
      const originalLoan = await tx.loan.findUnique({
        where: { id: originalLoanId },
        include: { client: true }
      });

      if (!originalLoan) throw new Error('Préstamo original no encontrado');
      if (originalLoan.status === 'PAID_OFF' || originalLoan.status === 'REFINANCED') {
        throw new Error('El préstamo ya está liquidado o refinanciado');
      }

      // 2. Generar número para el nuevo préstamo
      const loanCount = await tx.loan.count() + 1;
      const loanNumber = `EF-REF-${loanCount}`;

      // 3. Calcular detalles del nuevo préstamo
      const calculations = calculateLoanDetails({
        loanCalculationType: newLoanData.loanCalculationType,
        principalAmount: newLoanData.principalAmount,
        numberOfPayments: newLoanData.termMonths,
        paymentFrequency: newLoanData.paymentFrequency,
        annualInterestRate: newLoanData.interestRate,
        weeklyInterestAmount: newLoanData.weeklyInterestAmount,
        startDate: newLoanData.startDate
      });

      // 4. Crear el nuevo préstamo
      const newLoan = await tx.loan.create({
        data: {
          clientId: originalLoan.clientId,
          loanNumber,
          loanType: newLoanData.loanType as any,
          loanCalculationType: newLoanData.loanCalculationType,
          principalAmount: newLoanData.principalAmount,
          interestRate: newLoanData.interestRate,
          weeklyInterestAmount: newLoanData.weeklyInterestAmount || null,
          termMonths: newLoanData.termMonths,
          paymentFrequency: newLoanData.paymentFrequency,
          monthlyPayment: calculations.paymentAmount,
          totalAmount: calculations.totalAmount,
          balanceRemaining: newLoanData.principalAmount,
          startDate: newLoanData.startDate,
          endDate: calculations.endDate,
          status: 'ACTIVE',
          tenantId: this.tenantId,
          insuranceAmount: newLoanData.insuranceAmount || 0,
          disbursementFee: newLoanData.disbursementFee || 0,
          disbursedAmount: newLoanData.disbursedAmount || 0,
          isRefinancing: true,
          isRenewal: true,
          refinancedFromId: originalLoan.id
        }
      });

      // 5. Generar tabla de amortización para el nuevo préstamo
      const amortizationEntries = generateAmortizationSchedule({
        principalAmount: newLoanData.principalAmount,
        numberOfPayments: newLoanData.termMonths,
        paymentFrequency: newLoanData.paymentFrequency,
        loanCalculationType: newLoanData.loanCalculationType,
        annualInterestRate: newLoanData.interestRate,
        weeklyInterestAmount: newLoanData.weeklyInterestAmount,
        startDate: newLoanData.startDate,
        paymentAmount: calculations.paymentAmount
      });

      await tx.amortizationSchedule.createMany({
        data: amortizationEntries.map(entry => ({
          loanId: newLoan.id,
          paymentNumber: entry.paymentNumber,
          paymentDate: entry.paymentDate,
          principalPayment: entry.principalPayment,
          interestPayment: entry.interestPayment,
          totalPayment: entry.totalPayment,
          remainingBalance: entry.remainingBalance
        }))
      });

      // 6. Registrar el pago de liquidación en el préstamo original
      // Esto "cierra" el préstamo anterior contablemente
      if (settlementAmount > 0) {
        await tx.payment.create({
          data: {
            loanId: originalLoan.id,
            amount: settlementAmount,
            paymentDate: new Date(),
            paymentMethod: 'REFINANCE',
            status: 'COMPLETED',
            notes: notes || `Liquidación por refinanciamiento a préstamo ${loanNumber}`,
            processedBy,
            tenantId: this.tenantId
          }
        });
      }

      // 7. Actualizar el préstamo original
      await tx.loan.update({
        where: { id: originalLoan.id },
        data: {
          status: 'REFINANCED',
          balanceRemaining: 0
        }
      });

      // 8. Marcar cuotas pendientes del original como pagadas
      await tx.amortizationSchedule.updateMany({
        where: {
          loanId: originalLoan.id,
          isPaid: false
        },
        data: {
          isPaid: true
        }
      });

      return {
        originalLoanId: originalLoan.id,
        newLoanId: newLoan.id,
        loanNumber
      };
    });
  }

  /**
   * Renueva un préstamo (usualmente después de liquidar el anterior o cuando está por terminar).
   * A diferencia del refinanciamiento, no necesariamente absorbe saldo, es una continuidad.
   */
  async renew(params: {
    originalLoanId: string;
    newLoanData: any; // Mismo formato que arriba
    processedBy?: string;
  }) {
    const { originalLoanId, newLoanData, processedBy } = params;

    return await this.prisma.$transaction(async (tx: any) => {
      const originalLoan = await tx.loan.findUnique({ where: { id: originalLoanId } });
      if (!originalLoan) throw new Error('Préstamo original no encontrado');

      // Marcar el original como RENEWED si ya estaba pagado o está activo
      await tx.loan.update({
        where: { id: originalLoan.id },
        data: {
          status: originalLoan.status === 'ACTIVE' ? 'RENEWED' : originalLoan.status
        }
      });

      // Crear el nuevo préstamo con bandera de renovación
      // Reutilizamos la lógica de creación (aquí simplificada, idealmente llamar a un CreateLoanService)
      const loanCount = await tx.loan.count() + 1;
      const loanNumber = `EF-REN-${loanCount}`;

      const calculations = calculateLoanDetails({
        ...newLoanData,
        startDate: new Date(newLoanData.startDate)
      });

      const newLoan = await tx.loan.create({
        data: {
          ...newLoanData,
          clientId: originalLoan.clientId,
          loanNumber,
          monthlyPayment: calculations.paymentAmount,
          totalAmount: calculations.totalAmount,
          balanceRemaining: newLoanData.principalAmount,
          startDate: new Date(newLoanData.startDate),
          endDate: calculations.endDate,
          status: 'ACTIVE',
          tenantId: this.tenantId,
          isRenewal: true,
          refinancedFromId: originalLoan.id
        }
      });

      // Generar tabla...
      const amortizationEntries = generateAmortizationSchedule({
        ...newLoanData,
        startDate: new Date(newLoanData.startDate),
        paymentAmount: calculations.paymentAmount
      });

      await tx.amortizationSchedule.createMany({
        data: amortizationEntries.map(entry => ({
          loanId: newLoan.id,
          paymentNumber: entry.paymentNumber,
          paymentDate: entry.paymentDate,
          principalPayment: entry.principalPayment,
          interestPayment: entry.interestPayment,
          totalPayment: entry.totalPayment,
          remainingBalance: entry.remainingBalance
        }))
      });

      return newLoan;
    });
  }
}
