/**
 * Servicio de Comisiones
 * Q2 2026 - EscalaFin
 * 
 * Calcula y gestiona comisiones para asesores por originación de préstamos
 * y cobranza de pagos. Soporta múltiples esquemas de comisión.
 */

import { PrismaClient, CommissionStatus, CommissionType } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TIPOS
// ============================================

export interface CommissionRule {
    type: CommissionType;
    percentage?: number;      // Porcentaje del monto
    fixedAmount?: number;     // Monto fijo
    minAmount?: number;       // Monto mínimo del préstamo/pago para aplicar
    maxAmount?: number;       // Monto máximo de comisión
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
// SERVICIO PRINCIPAL
// ============================================

export const commissionService = {

    // -------------------------------------------------------
    // ESQUEMAS DE COMISIÓN
    // -------------------------------------------------------

    /**
     * Crear esquema de comisión
     */
    async createSchema(input: CreateSchemaInput) {
        return prisma.commissionSchema.create({
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
     * Listar esquemas de comisión
     */
    async listSchemas(tenantId: string) {
        return prisma.commissionSchema.findMany({
            where: { tenantId },
            include: {
                _count: { select: { records: true } },
            },
            orderBy: { createdAt: 'desc' },
        });
    },

    /**
     * Actualizar esquema
     */
    async updateSchema(schemaId: string, data: Partial<CreateSchemaInput>) {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.description !== undefined) updateData.description = data.description;
        if (data.rules) updateData.rules = JSON.stringify(data.rules);

        return prisma.commissionSchema.update({
            where: { id: schemaId },
            data: updateData,
        });
    },

    /**
     * Activar/Desactivar esquema
     */
    async toggleSchema(schemaId: string, isActive: boolean) {
        return prisma.commissionSchema.update({
            where: { id: schemaId },
            data: { isActive },
        });
    },

    // -------------------------------------------------------
    // CÁLCULO DE COMISIONES
    // -------------------------------------------------------

    /**
     * Calcular comisión por originación de préstamo
     */
    async calculateOriginationCommission(loanId: string, advisorId: string, tenantId: string) {
        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
        });

        if (!loan) throw new Error('Préstamo no encontrado');

        // Buscar esquema activo de originación
        const schema = await prisma.commissionSchema.findFirst({
            where: {
                tenantId,
                type: 'ORIGINATION',
                isActive: true,
            },
        });

        if (!schema) {
            console.log('[Comisiones] No hay esquema de originación activo');
            return null;
        }

        // Verificar que no exista ya una comisión para este préstamo
        const existing = await prisma.commissionRecord.findFirst({
            where: {
                sourceType: 'LOAN_ORIGINATION',
                sourceId: loanId,
                advisorId,
            },
        });

        if (existing) return existing;

        const rules: CommissionRule = JSON.parse(schema.rules);
        const loanAmount = Number(loan.principalAmount);
        const commissionAmount = this.applyRules(rules, loanAmount);

        if (commissionAmount <= 0) return null;

        return prisma.commissionRecord.create({
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
        const payment = await prisma.payment.findUnique({
            where: { id: paymentId },
        });

        if (!payment || payment.status !== 'COMPLETED') return null;

        // Buscar esquema activo de cobranza
        const schema = await prisma.commissionSchema.findFirst({
            where: {
                tenantId,
                type: 'COLLECTION',
                isActive: true,
            },
        });

        if (!schema) return null;

        // Verificar que no exista
        const existing = await prisma.commissionRecord.findFirst({
            where: {
                sourceType: 'PAYMENT_COLLECTION',
                sourceId: paymentId,
                advisorId,
            },
        });

        if (existing) return existing;

        const rules: CommissionRule = JSON.parse(schema.rules);
        const paymentAmount = Number(payment.amount);
        const commissionAmount = this.applyRules(rules, paymentAmount);

        if (commissionAmount <= 0) return null;

        return prisma.commissionRecord.create({
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
     * Aplicar reglas de comisión a un monto
     */
    applyRules(rules: CommissionRule, amount: number): number {
        // Verificar monto mínimo
        if (rules.minAmount && amount < rules.minAmount) return 0;

        // Comisión por escalas (tiers)
        if (rules.tiers && rules.tiers.length > 0) {
            for (const tier of rules.tiers) {
                if (amount >= tier.minAmount && amount <= tier.maxAmount) {
                    const commission = amount * (tier.percentage / 100);
                    return rules.maxAmount ? Math.min(commission, rules.maxAmount) : commission;
                }
            }
            return 0;
        }

        // Comisión por porcentaje
        if (rules.percentage) {
            const commission = amount * (rules.percentage / 100);
            return rules.maxAmount ? Math.min(commission, rules.maxAmount) : commission;
        }

        // Comisión fija
        if (rules.fixedAmount) {
            return rules.fixedAmount;
        }

        return 0;
    },

    // -------------------------------------------------------
    // GESTIÓN DE COMISIONES
    // -------------------------------------------------------

    /**
     * Aprobar comisiones pendientes
     */
    async approveCommissions(commissionIds: string[]) {
        return prisma.commissionRecord.updateMany({
            where: {
                id: { in: commissionIds },
                status: 'PENDING',
            },
            data: { status: 'APPROVED' },
        });
    },

    /**
     * Marcar comisiones como pagadas
     */
    async payCommissions(commissionIds: string[]) {
        return prisma.commissionRecord.updateMany({
            where: {
                id: { in: commissionIds },
                status: 'APPROVED',
            },
            data: {
                status: 'PAID',
                paidAt: new Date(),
            },
        });
    },

    /**
     * Listar comisiones con filtros
     */
    async list(filters: CommissionFilters) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;

        const where: any = { tenantId: filters.tenantId };
        if (filters.advisorId) where.advisorId = filters.advisorId;
        if (filters.status) where.status = filters.status;
        if (filters.type) {
            where.schema = { type: filters.type };
        }
        if (filters.dateFrom || filters.dateTo) {
            where.calculatedAt = {};
            if (filters.dateFrom) where.calculatedAt.gte = filters.dateFrom;
            if (filters.dateTo) where.calculatedAt.lte = filters.dateTo;
        }

        const [records, total] = await Promise.all([
            prisma.commissionRecord.findMany({
                where,
                include: {
                    advisor: { select: { id: true, firstName: true, lastName: true, email: true } },
                    schema: { select: { id: true, name: true, type: true } },
                },
                orderBy: { calculatedAt: 'desc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.commissionRecord.count({ where }),
        ]);

        return { records, total, page, limit, totalPages: Math.ceil(total / limit) };
    },

    /**
     * Resumen de comisiones por asesor
     */
    async getSummaryByAdvisor(tenantId: string, startDate?: Date, endDate?: Date): Promise<CommissionSummary[]> {
        const where: any = { tenantId };
        if (startDate || endDate) {
            where.calculatedAt = {};
            if (startDate) where.calculatedAt.gte = startDate;
            if (endDate) where.calculatedAt.lte = endDate;
        }

        const records = await prisma.commissionRecord.findMany({
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
                    advisorName: `${record.advisor.firstName} ${record.advisor.lastName}`,
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

            switch (record.schema.type) {
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
            prisma.commissionRecord.aggregate({
                where: { tenantId, status: 'PENDING' },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.commissionRecord.aggregate({
                where: { tenantId, status: 'APPROVED' },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.commissionRecord.aggregate({
                where: { tenantId, status: 'PAID' },
                _sum: { amount: true },
                _count: true,
            }),
            prisma.commissionRecord.aggregate({
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
