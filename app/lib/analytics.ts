
import { PrismaClient } from '@prisma/client';
import { subDays, startOfDay, endOfDay } from 'date-fns';

export interface AnalyticsData {
  loans: {
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    totalAmount: number;
    averageAmount: number;
  };
  payments: {
    total: number;
    totalAmount: number;
    onTime: number;
    late: number;
    defaulted: number;
  };
  portfolio: {
    activeLoans: number;
    totalOutstanding: number;
    totalRepaid: number;
    defaultRate: number;
    avgInterestRate: number;
  };
  users: {
    total: number;
    clients: number;
    advisors: number;
    admins: number;
    newThisMonth: number;
  };
  financial: {
    monthlyRevenue: number;
    totalRevenue: number;
    profitMargin: number;
    riskExposure: number;
  };
}

export interface TimeSeriesData {
  date: string;
  loans: number;
  payments: number;
  revenue: number;
}

export interface KPIData {
  name: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down' | 'stable';
  format: 'currency' | 'percentage' | 'number';
}

export class AnalyticsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getGeneralAnalytics(days: number = 30): Promise<AnalyticsData> {
    const startDate = subDays(new Date(), days);

    // Consultas paralelas para mejor rendimiento
    const [
      loans,
      payments,
      users,
      loanStats
    ] = await Promise.all([
      this.getLoanAnalytics(startDate),
      this.getPaymentAnalytics(startDate),
      this.getUserAnalytics(startDate),
      this.getLoanStatistics()
    ]);

    const portfolio = await this.getPortfolioAnalytics();
    const financial = await this.getFinancialAnalytics(startDate);

    return {
      loans,
      payments,
      portfolio,
      users,
      financial
    };
  }

  private async getLoanAnalytics(startDate: Date) {
    const loans = await this.prisma.loan.findMany({
      where: {
        createdAt: { gte: startDate }
      }
    });

    const totalAmount = loans.reduce((sum, loan) => sum + Number(loan.principalAmount), 0);

    return {
      total: loans.length,
      approved: loans.filter(l => l.status === 'ACTIVE').length,
      pending: 0, // No hay un status PENDING en el modelo Loan
      rejected: loans.filter(l => l.status === 'CANCELLED').length,
      totalAmount,
      averageAmount: loans.length > 0 ? totalAmount / loans.length : 0
    };
  }

  private async getPaymentAnalytics(startDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        paymentDate: { gte: startDate }
      },
      include: {
        amortizationSchedule: true
      }
    });

    const totalAmount = payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
    const now = new Date();

    return {
      total: payments.length,
      totalAmount,
      onTime: payments.filter(p => 
        p.status === 'COMPLETED' && 
        p.amortizationSchedule && 
        p.paymentDate <= p.amortizationSchedule.paymentDate
      ).length,
      late: payments.filter(p => 
        p.status === 'COMPLETED' && 
        p.amortizationSchedule && 
        p.paymentDate > p.amortizationSchedule.paymentDate
      ).length,
      defaulted: payments.filter(p => 
        p.status === 'FAILED'
      ).length,
    };
  }

  private async getPortfolioAnalytics() {
    const activeLoans = await this.prisma.loan.findMany({
      where: { status: 'ACTIVE' },
      include: { payments: true }
    });

    const totalOutstanding = activeLoans.reduce((sum, loan) => {
      const paidAmount = loan.payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((paidSum, payment) => paidSum + Number(payment.amount), 0);
      return sum + Math.max(0, Number(loan.totalAmount) - paidAmount);
    }, 0);

    const totalRepaid = activeLoans.reduce((sum, loan) => {
      return sum + loan.payments
        .filter(p => p.status === 'COMPLETED')
        .reduce((paidSum, payment) => paidSum + Number(payment.amount), 0);
    }, 0);

    const defaultedLoans = activeLoans.filter(loan => {
      return loan.payments.some(p => p.status === 'FAILED');
    }).length;

    const avgInterestRate = activeLoans.length > 0 
      ? activeLoans.reduce((sum, loan) => sum + Number(loan.interestRate), 0) / activeLoans.length
      : 0;

    return {
      activeLoans: activeLoans.length,
      totalOutstanding,
      totalRepaid,
      defaultRate: activeLoans.length > 0 ? (defaultedLoans / activeLoans.length) * 100 : 0,
      avgInterestRate
    };
  }

  private async getUserAnalytics(startDate: Date) {
    const users = await this.prisma.user.findMany();
    const newUsers = users.filter(u => u.createdAt >= startDate);

    return {
      total: users.length,
      clients: users.filter(u => u.role === 'CLIENTE').length,
      advisors: users.filter(u => u.role === 'ASESOR').length,
      admins: users.filter(u => u.role === 'ADMIN').length,
      newThisMonth: newUsers.length
    };
  }

  private async getFinancialAnalytics(startDate: Date) {
    const payments = await this.prisma.payment.findMany({
      where: {
        status: 'COMPLETED',
        paymentDate: { gte: startDate }
      },
      include: { loan: true }
    });

    const monthlyRevenue = payments.reduce((sum, payment) => {
      // Calcular interés ganado
      const interestAmount = Number(payment.amount) * (Number(payment.loan.interestRate) / 100);
      return sum + interestAmount;
    }, 0);

    const allPayments = await this.prisma.payment.findMany({
      where: { status: 'COMPLETED' },
      include: { loan: true }
    });

    const totalRevenue = allPayments.reduce((sum, payment) => {
      const interestAmount = Number(payment.amount) * (Number(payment.loan.interestRate) / 100);
      return sum + interestAmount;
    }, 0);

    const activeLoans = await this.prisma.loan.findMany({
      where: { status: 'ACTIVE' }
    });

    const riskExposure = activeLoans.reduce((sum, loan) => sum + Number(loan.principalAmount), 0);

    return {
      monthlyRevenue,
      totalRevenue,
      profitMargin: monthlyRevenue > 0 ? (monthlyRevenue / (monthlyRevenue * 0.7)) * 100 : 0,
      riskExposure
    };
  }

  private async getLoanStatistics() {
    // Implementación adicional para estadísticas de préstamos
    return {};
  }

  async getTimeSeriesData(days: number = 30): Promise<TimeSeriesData[]> {
    const data: TimeSeriesData[] = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dateStart = startOfDay(date);
      const dateEnd = endOfDay(date);

      const [loans, payments] = await Promise.all([
        this.prisma.loan.count({
          where: {
            createdAt: { gte: dateStart, lte: dateEnd }
          }
        }),
        this.prisma.payment.findMany({
          where: {
            paymentDate: { gte: dateStart, lte: dateEnd },
            status: 'COMPLETED'
          },
          include: { loan: true }
        })
      ]);

      const revenue = payments.reduce((sum, payment) => {
        const interestAmount = Number(payment.amount) * (Number(payment.loan.interestRate) / 100);
        return sum + interestAmount;
      }, 0);

      data.push({
        date: date.toISOString().split('T')[0],
        loans,
        payments: payments.length,
        revenue
      });
    }

    return data;
  }

  async getKPIs(): Promise<KPIData[]> {
    const currentMonth = await this.getGeneralAnalytics(30);
    const previousMonth = await this.getGeneralAnalytics(60);

    const kpis: KPIData[] = [
      {
        name: 'Préstamos Aprobados',
        value: currentMonth.loans.approved,
        change: this.calculateChange(currentMonth.loans.approved, previousMonth.loans.approved),
        trend: currentMonth.loans.approved > previousMonth.loans.approved ? 'up' : 'down',
        format: 'number'
      },
      {
        name: 'Cartera Total',
        value: currentMonth.portfolio.totalOutstanding,
        change: this.calculateChange(currentMonth.portfolio.totalOutstanding, previousMonth.portfolio.totalOutstanding),
        trend: currentMonth.portfolio.totalOutstanding > previousMonth.portfolio.totalOutstanding ? 'up' : 'down',
        format: 'currency'
      },
      {
        name: 'Tasa de Morosidad',
        value: `${currentMonth.portfolio.defaultRate.toFixed(2)}%`,
        change: this.calculateChange(currentMonth.portfolio.defaultRate, previousMonth.portfolio.defaultRate),
        trend: currentMonth.portfolio.defaultRate < previousMonth.portfolio.defaultRate ? 'up' : 'down',
        format: 'percentage'
      },
      {
        name: 'Ingresos Mensuales',
        value: currentMonth.financial.monthlyRevenue,
        change: this.calculateChange(currentMonth.financial.monthlyRevenue, previousMonth.financial.monthlyRevenue),
        trend: currentMonth.financial.monthlyRevenue > previousMonth.financial.monthlyRevenue ? 'up' : 'down',
        format: 'currency'
      }
    ];

    return kpis;
  }

  private calculateChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  }
}
