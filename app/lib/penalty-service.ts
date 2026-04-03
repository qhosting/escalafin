
import { getTenantPrisma } from '@/lib/tenant-db';

export class PenaltyService {
    private prisma: any;
    private tenantId: string;

    constructor(tenantId: string) {
        this.tenantId = tenantId;
        this.prisma = getTenantPrisma(tenantId);
    }

    /**
     * Aplica penalizaciones de $200 a todas las cuotas vencidas que no han llegado al tope de $800.
     * @param loanId Opcional, para filtrar por un préstamo específico.
     */
    async applyPenalties(loanId?: string) {
        const today = new Date();
        // No normalizamos a medianoche para capturar si ya pasó la hora de pago si fuera necesario, 
        // pero el requerimiento de "Cierre" sugiere que se hace al final del día.
        // Usamos la fecha operativa.

        // 1. Buscar cuotas vencidas y no pagadas
        const overdueInstallments = await this.prisma.amortizationSchedule.findMany({
            where: {
                loanId: loanId,
                isPaid: false,
                paymentDate: {
                    lt: today
                },
                loan: {
                    status: 'ACTIVE',
                    client: {
                        status: 'ACTIVE'
                        // autoPenalties: true // Lo agregamos al filtro si el usuario confirmó que es por cliente
                    }
                }
            },
            include: {
                penalties: true,
                loan: {
                    include: {
                        client: true
                    }
                }
            }
        });

        const createdPenalties = [];

        for (const installment of overdueInstallments) {
            // Filtrar multas que pertenezcan a este installment
            const currentPenaltiesCount = installment.penalties.length;
            const currentTotalAmount = installment.penalties.reduce((sum: number, p: any) => sum + Number(p.amount), 0);

            // Solo aplicar si el cliente tiene habilitado autoPenalties
            if (installment.loan.client.autoPenalties === false) continue;

            // Regla: Máximo $800 por cuota (ej: 4 multas de $200)
            if (currentTotalAmount < 800) {
                const newPenalty = await this.prisma.lateFeePenalty.create({
                    data: {
                        loanId: installment.loanId,
                        tenantId: this.tenantId,
                        installmentId: installment.id,
                        amount: 200,
                        status: 'PENDING',
                        reason: `Incumplimiento Pago #${installment.paymentNumber} (${installment.paymentDate.toLocaleDateString()})`
                    }
                });
                createdPenalties.push(newPenalty);
            }
        }

        return createdPenalties;
    }

    /**
     * Registra el pago de una lista de penalizaciones.
     */
    async payPenalties(penaltyIds: string[], paymentId: string) {
        if (!penaltyIds || penaltyIds.length === 0) return null;
        
        return await this.prisma.lateFeePenalty.updateMany({
            where: {
                id: { in: penaltyIds },
                tenantId: this.tenantId
            },
            data: {
                status: 'COMPLETED',
                paidAt: new Date(),
                paymentId: paymentId
            }
        });
    }

    /**
     * Obtiene las penalizaciones pendientes agrupadas por installment.
     */
    async getPendingPenalties(loanId: string) {
        return await this.prisma.lateFeePenalty.findMany({
            where: {
                loanId: loanId,
                status: 'PENDING',
                tenantId: this.tenantId
            },
            include: {
                installment: true
            },
            orderBy: {
                createdAt: 'asc'
            }
        });
    }

    /**
     * Calcula el total de penalizaciones pendientes para un préstamo.
     */
    async getTotalPendingAmount(loanId: string) {
        const penalties = await this.getPendingPenalties(loanId);
        return penalties.reduce((sum: number, p: any) => sum + Number(p.amount), 0);
    }

    /**
     * Obtiene todas las penalizaciones con filtros y paginación.
     */
    async getAllPenalties(options: { 
        page?: number, 
        limit?: number, 
        status?: string, 
        clientId?: string,
        loanId?: string,
        startDate?: Date,
        endDate?: Date
    }) {
        const { page = 1, limit = 20, status, clientId, loanId, startDate, endDate } = options;
        const skip = (page - 1) * limit;

        const where: any = {
            tenantId: this.tenantId
        };

        if (status) where.status = status;
        if (loanId) where.loanId = loanId;
        if (clientId) {
            where.loan = {
                clientId: clientId
            };
        }
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const [penalties, totalCount] = await Promise.all([
            this.prisma.lateFeePenalty.findMany({
                where,
                include: {
                    loan: {
                        include: {
                            client: true
                        }
                    },
                    installment: true
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: limit
            }),
            this.prisma.lateFeePenalty.count({ where })
        ]);

        return {
            penalties,
            pagination: {
                totalCount,
                totalPages: Math.ceil(totalCount / limit),
                currentPage: page,
                limit
            }
        };
    }

    /**
     * Actualiza una penalización (ej: cambiar estado a CANCELLED o marcar como pagada).
     */
    async updatePenalty(penaltyId: string, data: any) {
        return await this.prisma.lateFeePenalty.update({
            where: {
                id: penaltyId,
                tenantId: this.tenantId
            },
            data
        });
    }

    /**
     * Elimina una penalización permanentemente.
     */
    async deletePenalty(penaltyId: string) {
        return await this.prisma.lateFeePenalty.delete({
            where: {
                id: penaltyId,
                tenantId: this.tenantId
            }
        });
    }

    /**
     * Crea una penalización manualmente.
     */
    async createManualPenalty(data: {
        loanId: string,
        amount: number,
        reason: string,
        installmentId?: string
    }) {
        return await this.prisma.lateFeePenalty.create({
            data: {
                ...data,
                tenantId: this.tenantId,
                status: 'PENDING'
            }
        });
    }
}
