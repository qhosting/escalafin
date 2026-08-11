/**
 * Servicio de Comisiones Multi-Tenant
 * EscalaFin
 * 
 * Calcula y gestiona comisiones para asesores por originación de préstamos
 * y cobranza de pagos. Soporta múltiples esquemas de comisión por tenant.
 */

import { getTenantPrisma } from '@/lib/tenant-db';
import { CommissionStatus, CommissionType } from '@prisma/client';

// ============================================
// TIPOS
// ============================================

export interface CommissionRule {
  type: CommissionType;
  percentage?: number;      // Porcentaje del monto (ej. 3 para 3%)
  fixedAmount?: number;     // Monto fijo en MXN (ej. 500)
  minAmount?: number;       // Monto mínimo del préstamo/pago para aplicar
  maxAmount?: number;       // Monto máximo de comisión tope
  tiers?: CommissionTier[]; // Escalas por monto
}

export interface CommissionTier {
  minAmount: number;
  maxAmount: number;
  percentage: number;
}

export interface CreateSchemaInput {
  name: string;
  description?: string;
  type: CommissionType;
  rules: CommissionRule;
  tenantId: string;
}

export interface CommissionSummary {
  advisorId: string;
  advisorName: string;
  totalEarned: number;
  totalPending: number;
  totalPaid: number;
  originationCount: number;
  collectionCount: number;
  bonusCount: number;
  originationAmount: number;
  collectionAmount: number;
  bonusAmount: number;
}

export interface CommissionFilters {
  tenantId: string;
  advisorId?: string;
  status?: CommissionStatus;
  type?: CommissionType;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

// ============================================
// SERVICIO PRINCIPAL MULTI-TENANT
// ============================================

export const commissionService = {

  // -------------------------------------------------------
  // ESQUEMAS DE COMISIÓN
  // -------------------------------------------------------

  /**
   * Crear esquema de comisión
   */
  async createSchema(input: CreateSchemaInput) {
    const tenantPrisma = getTenantPrisma(input.tenantId);
    return (tenantPrisma as any).commissionSchema.create({
      data: {
        name: input.name,
        description: input.description,
        type: input.type,
        rules: JSON.stringify(input.rules),
        isActive: true,
        tenantId: input.tenantId,
      },
    });
  },

  /**
   * Listar esquemas de comisión por tenant
   */
  async listSchemas(tenantId: string) {
    const tenantPrisma = getTenantPrisma(tenantId);
    return (tenantPrisma as any).commissionSchema.findMany({
      where: { tenantId },
      include: {
        _count: { select: { records: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  /**
   * Actualizar esquema de comisión
   */
  async updateSchema(tenantId: string, schemaId: string, data: Partial<CreateSchemaInput>) {
    const tenantPrisma = getTenantPrisma(tenantId);
    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.rules) updateData.rules = JSON.stringify(data.rules);

    return (tenantPrisma as any).commissionSchema.update({
      where: { id: schemaId },
      data: updateData,
    });
  },

  /**
   * Activar/Desactivar esquema
   */
  async toggleSchema(tenantId: string, schemaId: string, isActive: boolean) {
    const tenantPrisma = getTenantPrisma(tenantId);
    return (tenantPrisma as any).commissionSchema.update({
      where: { id: schemaId },
      data: { isActive },
    });
  },

  /**
   * Eliminar esquema si no tiene registros asociados
   */
  async deleteSchema(tenantId: string, schemaId: string) {
    const tenantPrisma = getTenantPrisma(tenantId);
    const recordsCount = await (tenantPrisma as any).commissionRecord.count({
      where: { schemaId, tenantId }
    });

    if (recordsCount > 0) {
      // Si tiene registros, solo desactivar
      return (tenantPrisma as any).commissionSchema.update({
        where: { id: schemaId },
        data: { isActive: false }
      });
    }

    return (tenantPrisma as any).commissionSchema.delete({
      where: { id: schemaId }
    });
  },

  // -------------------------------------------------------
  // CÁLCULO AUTOMÁTICO DE COMISIONES
  // -------------------------------------------------------

  /**
   * Calcular comisión por originación de préstamo
   */
  async calculateOriginationCommission(loanId: string, advisorId: string, tenantId: string) {
    if (!loanId || !advisorId || !tenantId) return null;

    const tenantPrisma = getTenantPrisma(tenantId);

    const loan = await (tenantPrisma as any).loan.findUnique({
      where: { id: loanId },
    });

    if (!loan) return null;

    // Buscar esquema activo de originación
    const schema = await (tenantPrisma as any).commissionSchema.findFirst({
      where: {
        tenantId,
        type: 'ORIGINATION',
        isActive: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!schema) {
      console.log(`[Comisiones] No hay esquema de originación activo para tenant: ${tenantId}`);
      return null;
    }

    // Verificar que no exista ya una comisión para este préstamo
    const existing = await (tenantPrisma as any).commissionRecord.findFirst({
      where: {
        tenantId,
        sourceType: 'LOAN_ORIGINATION',
        sourceId: loanId,
        advisorId,
      },
    });

    if (existing) return existing;

    let rules: CommissionRule;
    try {
      rules = typeof schema.rules === 'string' ? JSON.parse(schema.rules) : schema.rules;
    } catch (e) {
      console.error('[Comisiones] Error analizando reglas JSON del esquema:', e);
      return null;
    }

    const loanAmount = Number(loan.principalAmount);
    const commissionAmount = this.applyRules(rules, loanAmount);

    if (commissionAmount <= 0) return null;

    return (tenantPrisma as any).commissionRecord.create({
      data: {
        advisorId,
        schemaId: schema.id,
        amount: commissionAmount,
        status: 'PENDING',
        sourceType: 'LOAN_ORIGINATION',
        sourceId: loanId,
        tenantId,
      },
    });
  },

  /**
   * Calcular comisión por cobranza
   */
  async calculateCollectionCommission(paymentId: string, advisorId: string, tenantId: string) {
    if (!paymentId || !advisorId || !tenantId) return null;

    const tenantPrisma = getTenantPrisma(tenantId);

    const payment = await (tenantPrisma as any).payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment || payment.status !== 'COMPLETED') return null;

    // Buscar esquema activo de cobranza
    const schema = await (tenantPrisma as any).commissionSchema.findFirst({
      where: {
        tenantId,
        type: 'COLLECTION',
        isActive: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!schema) return null;

    // Verificar que no exista ya registro
    const existing = await (tenantPrisma as any).commissionRecord.findFirst({
      where: {
        tenantId,
        sourceType: 'PAYMENT_COLLECTION',
        sourceId: paymentId,
        advisorId,
      },
    });

    if (existing) return existing;

    let rules: CommissionRule;
    try {
      rules = typeof schema.rules === 'string' ? JSON.parse(schema.rules) : schema.rules;
    } catch (e) {
      console.error('[Comisiones] Error analizando reglas JSON del esquema:', e);
      return null;
    }

    const paymentAmount = Number(payment.amount);
    const commissionAmount = this.applyRules(rules, paymentAmount);

    if (commissionAmount <= 0) return null;

    return (tenantPrisma as any).commissionRecord.create({
      data: {
        advisorId,
        schemaId: schema.id,
        amount: commissionAmount,
        status: 'PENDING',
        sourceType: 'PAYMENT_COLLECTION',
        sourceId: paymentId,
        tenantId,
      },
    });
  },

  /**
   * Aplicar reglas matemáticas de comisión
   */
  applyRules(rules: CommissionRule, amount: number): number {
    if (!amount || amount <= 0) return 0;

    // Verificar monto mínimo requerido para aplicar
    if (rules.minAmount && amount < rules.minAmount) return 0;

    let result = 0;

    // 1. Escalas (tiers)
    if (rules.tiers && Array.isArray(rules.tiers) && rules.tiers.length > 0) {
      for (const tier of rules.tiers) {
        if (amount >= tier.minAmount && amount <= tier.maxAmount) {
          result = amount * (tier.percentage / 100);
          break;
        }
      }
    } 
    // 2. Porcentaje simple
    else if (rules.percentage && rules.percentage > 0) {
      result = amount * (rules.percentage / 100);
    } 
    // 3. Monto fijo
    else if (rules.fixedAmount && rules.fixedAmount > 0) {
      result = rules.fixedAmount;
    }

    // Aplicar límite máximo (cap) si está definido
    if (rules.maxAmount && rules.maxAmount > 0 && result > rules.maxAmount) {
      result = rules.maxAmount;
    }

    return Math.round(result * 100) / 100;
  },

  // -------------------------------------------------------
  // GESTIÓN Y ACCIONES EN LOTE
  // -------------------------------------------------------

  /**
   * Aprobar comisiones pendientes por Lote
   */
  async approveCommissions(tenantId: string, commissionIds: string[]) {
    const tenantPrisma = getTenantPrisma(tenantId);
    return (tenantPrisma as any).commissionRecord.updateMany({
      where: {
        tenantId,
        id: { in: commissionIds },
        status: 'PENDING',
      },
      data: { status: 'APPROVED' },
    });
  },

  /**
   * Marcar comisiones aprobadas como pagadas
   */
  async payCommissions(tenantId: string, commissionIds: string[]) {
    const tenantPrisma = getTenantPrisma(tenantId);
    return (tenantPrisma as any).commissionRecord.updateMany({
      where: {
        tenantId,
        id: { in: commissionIds },
        status: { in: ['PENDING', 'APPROVED'] },
      },
      data: {
        status: 'PAID',
        paidAt: new Date(),
      },
    });
  },

  /**
   * Cancelar comisiones
   */
  async cancelCommissions(tenantId: string, commissionIds: string[]) {
    const tenantPrisma = getTenantPrisma(tenantId);
    return (tenantPrisma as any).commissionRecord.updateMany({
      where: {
        tenantId,
        id: { in: commissionIds },
      },
      data: {
        status: 'CANCELLED',
      },
    });
  },

  /**
   * Recalcular comisiones masivas para préstamos y pagos existentes
   */
  async recalculateTenantCommissions(tenantId: string) {
    const tenantPrisma = getTenantPrisma(tenantId);

    // 1. Obtener préstamos activos con cliente asignado a un asesor
    const loans = await (tenantPrisma as any).loan.findMany({
      where: { tenantId },
      include: { client: { select: { asesorId: true } } }
    });

    let originationCalculated = 0;
    for (const loan of loans) {
      if (loan.client?.asesorId) {
        const res = await this.calculateOriginationCommission(loan.id, loan.client.asesorId, tenantId);
        if (res) originationCalculated++;
      }
    }

    // 2. Obtener pagos de préstamos cuyos clientes tengan asesor
    const payments = await (tenantPrisma as any).payment.findMany({
      where: { tenantId, status: 'COMPLETED' },
      include: { loan: { include: { client: { select: { asesorId: true } } } } }
    });

    let collectionCalculated = 0;
    for (const payment of payments) {
      const advisorId = payment.loan?.client?.asesorId;
      if (advisorId) {
        const res = await this.calculateCollectionCommission(payment.id, advisorId, tenantId);
        if (res) collectionCalculated++;
      }
    }

    return {
      totalLoansProcessed: loans.length,
      originationCalculated,
      totalPaymentsProcessed: payments.length,
      collectionCalculated
    };
  },

  /**
   * Listar comisiones con paginación y filtros
   */
  async list(filters: CommissionFilters) {
    const page = filters.page ?? 1;
    const limit = filters.limit ?? 20;
    const tenantPrisma = getTenantPrisma(filters.tenantId);

    const where: any = { tenantId: filters.tenantId };
    if (filters.advisorId && filters.advisorId !== 'all') where.advisorId = filters.advisorId;
    if (filters.status && filters.status !== 'all') where.status = filters.status;
    if (filters.type && filters.type !== 'all') {
      where.schema = { type: filters.type };
    }
    if (filters.dateFrom || filters.dateTo) {
      where.calculatedAt = {};
      if (filters.dateFrom) where.calculatedAt.gte = filters.dateFrom;
      if (filters.dateTo) where.calculatedAt.lte = filters.dateTo;
    }

    const [records, total] = await Promise.all([
      (tenantPrisma as any).commissionRecord.findMany({
        where,
        include: {
          advisor: { select: { id: true, firstName: true, lastName: true, email: true } },
          schema: { select: { id: true, name: true, type: true } },
        },
        orderBy: { calculatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      (tenantPrisma as any).commissionRecord.count({ where }),
    ]);

    return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  /**
   * Resumen analítico de comisiones por asesor
   */
  async getSummaryByAdvisor(tenantId: string, startDate?: Date, endDate?: Date): Promise<CommissionSummary[]> {
    const tenantPrisma = getTenantPrisma(tenantId);
    const where: any = { tenantId };

    if (startDate || endDate) {
      where.calculatedAt = {};
      if (startDate) where.calculatedAt.gte = startDate;
      if (endDate) where.calculatedAt.lte = endDate;
    }

    const records = await (tenantPrisma as any).commissionRecord.findMany({
      where,
      include: {
        advisor: { select: { id: true, firstName: true, lastName: true } },
        schema: { select: { type: true } },
      },
    });

    const advisorMap = new Map<string, CommissionSummary>();

    for (const record of records) {
      const key = record.advisorId;
      let summary = advisorMap.get(key);

      if (!summary) {
        summary = {
          advisorId: record.advisorId,
          advisorName: `${record.advisor?.firstName || 'Asesor'} ${record.advisor?.lastName || ''}`.trim(),
          totalEarned: 0,
          totalPending: 0,
          totalPaid: 0,
          originationCount: 0,
          collectionCount: 0,
          bonusCount: 0,
          originationAmount: 0,
          collectionAmount: 0,
          bonusAmount: 0,
        };
        advisorMap.set(key, summary);
      }

      const amount = Number(record.amount);
      summary.totalEarned += amount;

      if (record.status === 'PENDING' || record.status === 'APPROVED') {
        summary.totalPending += amount;
      } else if (record.status === 'PAID') {
        summary.totalPaid += amount;
      }

      switch (record.schema?.type) {
        case 'ORIGINATION':
          summary.originationCount++;
          summary.originationAmount += amount;
          break;
        case 'COLLECTION':
          summary.collectionCount++;
          summary.collectionAmount += amount;
          break;
        case 'BONUS':
          summary.bonusCount++;
          summary.bonusAmount += amount;
          break;
      }
    }

    return Array.from(advisorMap.values())
      .sort((a, b) => b.totalEarned - a.totalEarned);
  },

  /**
   * Dashboard resumen global de comisiones
   */
  async getDashboard(tenantId: string, period?: string) {
    const tenantPrisma = getTenantPrisma(tenantId);
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      case 'month':
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
    }

    const [
      totalPending,
      totalApproved,
      totalPaid,
      totalThisPeriod,
      advisorSummaries,
    ] = await Promise.all([
      (tenantPrisma as any).commissionRecord.aggregate({
        where: { tenantId, status: 'PENDING' },
        _sum: { amount: true },
        _count: true,
      }),
      (tenantPrisma as any).commissionRecord.aggregate({
        where: { tenantId, status: 'APPROVED' },
        _sum: { amount: true },
        _count: true,
      }),
      (tenantPrisma as any).commissionRecord.aggregate({
        where: { tenantId, status: 'PAID' },
        _sum: { amount: true },
        _count: true,
      }),
      (tenantPrisma as any).commissionRecord.aggregate({
        where: {
          tenantId,
          calculatedAt: { gte: startDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      this.getSummaryByAdvisor(tenantId, startDate),
    ]);

    return {
      pending: {
        count: totalPending._count,
        amount: Number(totalPending._sum.amount ?? 0),
      },
      approved: {
        count: totalApproved._count,
        amount: Number(totalApproved._sum.amount ?? 0),
      },
      paid: {
        count: totalPaid._count,
        amount: Number(totalPaid._sum.amount ?? 0),
      },
      thisPeriod: {
        count: totalThisPeriod._count,
        amount: Number(totalThisPeriod._sum.amount ?? 0),
      },
      topAdvisors: advisorSummaries.slice(0, 5),
    };
  },
};

export default commissionService;
