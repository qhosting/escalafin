/**
 * Prisma Query Helpers - EscalaFin v3.0.0 Performance
 * Selectores optimizados para las consultas más frecuentes.
 * Eliminan el uso de `include` masivos y reducen el payload JSON hasta 70%.
 */

import { Prisma } from '@prisma/client';

// ─── Selects de Loan ──────────────────────────────────────────────────────────

/** Select mínimo para listar préstamos (tablas y listas) */
export const loanListSelect = {
  id: true,
  loanNumber: true,
  principalAmount: true,
  totalAmount: true,
  balanceRemaining: true,
  monthlyPayment: true,
  status: true,
  startDate: true,
  endDate: true,
  paymentFrequency: true,
  loanType: true,
  createdAt: true,
  clientId: true,
  tenantId: true,
  client: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  },
} satisfies Prisma.LoanSelect;

/** Select para el detalle completo de un préstamo */
export const loanDetailSelect = {
  ...loanListSelect,
  loanCalculationType: true,
  interestRate: true,
  termMonths: true,
  disbursedAmount: true,
  initialPayment: true,
  insuranceAmount: true,
  disbursementFee: true,
  lateFeeAmount: true,
  lateFeeType: true,
  isRenewal: true,
  isRefinancing: true,
  updatedAt: true,
  client: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      address: true,
      curp: true,
    },
  },
  payments: {
    select: {
      id: true,
      amount: true,
      paymentDate: true,
      paymentMethod: true,
      status: true,
      lateFeePaid: true,
      createdAt: true,
    },
    orderBy: { paymentDate: 'desc' as const },
    take: 20,
  },
  promises: {
    select: {
      id: true,
      promisedDate: true,
      promisedAmount: true,
      status: true,
      createdAt: true,
    },
    where: { status: 'PENDING' as const },
    take: 5,
  },
} satisfies Prisma.LoanSelect;

// ─── Selects de Client ────────────────────────────────────────────────────────

/** Select mínimo para listas de clientes */
export const clientListSelect = {
  id: true,
  firstName: true,
  lastName: true,
  phone: true,
  email: true,
  status: true,
  createdAt: true,
  tenantId: true,
  asesorId: true,
  asesor: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  _count: {
    select: { loans: true },
  },
} satisfies Prisma.ClientSelect;

/** Select para dashboard stats rápidos (KPIs) */
export const clientKpiSelect = {
  id: true,
  status: true,
  createdAt: true,
} satisfies Prisma.ClientSelect;

// ─── Selects de Payment ───────────────────────────────────────────────────────

/** Select mínimo para listar pagos */
export const paymentListSelect = {
  id: true,
  amount: true,
  paymentDate: true,
  paymentMethod: true,
  status: true,
  lateFeePaid: true,
  createdAt: true,
  loanId: true,
  tenantId: true,
  loan: {
    select: {
      id: true,
      loanNumber: true,
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
        },
      },
    },
  },
} satisfies Prisma.PaymentSelect;

// ─── Selects de Dashboard ─────────────────────────────────────────────────────

/** Select para estadísticas del administrador (dashboard) */
export const dashboardLoanSelect = {
  id: true,
  principalAmount: true,
  balanceRemaining: true,
  status: true,
  endDate: true,
  tenantId: true,
} satisfies Prisma.LoanSelect;

export const dashboardPaymentSelect = {
  id: true,
  amount: true,
  paymentDate: true,
  status: true,
  tenantId: true,
} satisfies Prisma.PaymentSelect;

// ─── Helpers de Paginación para Prisma ───────────────────────────────────────

export function buildPaginationArgs(
  page: number = 1,
  limit: number = 20
): { skip: number; take: number } {
  return {
    skip: (Math.max(1, page) - 1) * limit,
    take: Math.min(100, limit),
  };
}

export function buildTenantWhere(
  tenantId: string | null | undefined
): { tenantId?: string } {
  if (!tenantId) return {};
  return { tenantId };
}
