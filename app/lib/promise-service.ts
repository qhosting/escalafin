/**
 * Servicio de Promesas de Pago
 * Q2 2026 - EscalaFin
 * 
 * Gestiona el registro, seguimiento y cumplimiento de promesas de pago.
 * Incluye recordatorios automáticos y análisis de cumplimiento.
 */

import { PrismaClient, PromiseStatus } from '@prisma/client';

const prisma = new PrismaClient();

// ============================================
// TIPOS
// ============================================

export interface CreatePromiseInput {
    loanId: string;
    clientId: string;
    amount: number;
    promiseDate: Date;
    notes?: string;
    collectionVisitId?: string;
    tenantId?: string;
}

export interface PromiseFilters {
    tenantId: string;
    clientId?: string;
    loanId?: string;
    status?: PromiseStatus;
    dateFrom?: Date;
    dateTo?: Date;
    page?: number;
    limit?: number;
}

export interface PromiseAnalytics {
    totalPromises: number;
    fulfilled: number;
    broken: number;
    pending: number;
    fulfillmentRate: number;
    totalAmountPromised: number;
    totalAmountFulfilled: number;
    averageDaysToFulfill: number;
    topDefaulters: Array<{
        clientId: string;
        clientName: string;
        brokenCount: number;
    }>;
}

// ============================================
// SERVICIO PRINCIPAL
// ============================================

export const promiseToPayService = {

    /**
     * Crear una promesa de pago
     */
    async create(input: CreatePromiseInput) {
        // Validar que el préstamo existe y está activo
        const loan = await prisma.loan.findUnique({
            where: { id: input.loanId },
            include: { client: true },
        });

        if (!loan) throw new Error('Préstamo no encontrado');
        if (loan.status !== 'ACTIVE') throw new Error('El préstamo no está activo');

        // Verificar que no haya una promesa pendiente para el mismo préstamo
        const existingPromise = await prisma.promiseToPay.findFirst({
            where: {
                loanId: input.loanId,
                status: 'PENDING',
            },
        });

        if (existingPromise) {
            throw new Error('Ya existe una promesa de pago pendiente para este préstamo');
        }

        const promise = await prisma.promiseToPay.create({
            data: {
                loanId: input.loanId,
                clientId: input.clientId,
                amount: input.amount,
                promiseDate: input.promiseDate,
                status: 'PENDING',
                notes: input.notes,
                collectionVisitId: input.collectionVisitId,
                tenantId: input.tenantId,
            },
            include: {
                loan: true,
                client: true,
            },
        });

        return promise;
    },

    /**
     * Verificar y actualizar promesas vencidas automáticamente
     * (Para ejecutar como cron job)
     */
    async checkExpiredPromises(tenantId?: string) {
        const now = new Date();

        const where: any = {
            status: 'PENDING',
            promiseDate: { lt: now },
        };
        if (tenantId) where.tenantId = tenantId;

        // Buscar promesas vencidas que no se cumplieron
        const expiredPromises = await prisma.promiseToPay.findMany({
            where,
            include: {
                client: true,
                loan: true,
            },
        });

        const results = {
            checked: expiredPromises.length,
            markedBroken: 0,
            markedFulfilled: 0,
        };

        for (const promise of expiredPromises) {
            // Verificar si se realizó un pago en la fecha de la promesa (±2 días de tolerancia)
            const toleranceStart = new Date(promise.promiseDate);
            toleranceStart.setDate(toleranceStart.getDate() - 1);
            const toleranceEnd = new Date(promise.promiseDate);
            toleranceEnd.setDate(toleranceEnd.getDate() + 2);

            const payment = await prisma.payment.findFirst({
                where: {
                    loanId: promise.loanId,
                    status: 'COMPLETED',
                    amount: { gte: Number(promise.amount) * 0.9 }, // 90% del monto prometido
                    paymentDate: {
                        gte: toleranceStart,
                        lte: toleranceEnd,
                    },
                },
            });

            if (payment) {
                await prisma.promiseToPay.update({
                    where: { id: promise.id },
                    data: { status: 'FULFILLED' },
                });
                results.markedFulfilled++;
            } else {
                // Dar 2 días de gracia después de la fecha prometida
                const gracePeriodEnd = new Date(promise.promiseDate);
                gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 2);

                if (now > gracePeriodEnd) {
                    await prisma.promiseToPay.update({
                        where: { id: promise.id },
                        data: { status: 'BROKEN' },
                    });
                    results.markedBroken++;
                }
            }
        }

        return results;
    },

    /**
     * Marcar una promesa como cumplida manualmente
     */
    async markFulfilled(promiseId: string) {
        return prisma.promiseToPay.update({
            where: { id: promiseId },
            data: { status: 'FULFILLED' },
        });
    },

    /**
     * Cancelar una promesa
     */
    async cancel(promiseId: string) {
        return prisma.promiseToPay.update({
            where: { id: promiseId },
            data: { status: 'CANCELLED' },
        });
    },

    /**
     * Listar promesas con filtros
     */
    async list(filters: PromiseFilters) {
        const page = filters.page ?? 1;
        const limit = filters.limit ?? 20;

        const where: any = { tenantId: filters.tenantId };
        if (filters.clientId) where.clientId = filters.clientId;
        if (filters.loanId) where.loanId = filters.loanId;
        if (filters.status) where.status = filters.status;
        if (filters.dateFrom || filters.dateTo) {
            where.promiseDate = {};
            if (filters.dateFrom) where.promiseDate.gte = filters.dateFrom;
            if (filters.dateTo) where.promiseDate.lte = filters.dateTo;
        }

        const [promises, total] = await Promise.all([
            prisma.promiseToPay.findMany({
                where,
                include: {
                    client: { select: { id: true, firstName: true, lastName: true, phone: true } },
                    loan: { select: { id: true, loanNumber: true, balanceRemaining: true } },
                    collectionVisit: { select: { id: true, visitDate: true, outcome: true } },
                },
                orderBy: { promiseDate: 'asc' },
                skip: (page - 1) * limit,
                take: limit,
            }),
            prisma.promiseToPay.count({ where }),
        ]);

        return { promises, total, page, limit, totalPages: Math.ceil(total / limit) };
    },

    /**
     * Obtener promesas próximas a vencer (para recordatorios)
     */
    async getUpcoming(tenantId: string, daysAhead: number = 3) {
        const now = new Date();
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + daysAhead);

        return prisma.promiseToPay.findMany({
            where: {
                tenantId,
                status: 'PENDING',
                promiseDate: {
                    gte: now,
                    lte: futureDate,
                },
            },
            include: {
                client: { select: { id: true, firstName: true, lastName: true, phone: true } },
                loan: { select: { id: true, loanNumber: true } },
            },
            orderBy: { promiseDate: 'asc' },
        });
    },

    /**
     * Analytics de promesas de pago
     */
    async getAnalytics(tenantId: string, startDate?: Date, endDate?: Date): Promise<PromiseAnalytics> {
        const where: any = { tenantId };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = startDate;
            if (endDate) where.createdAt.lte = endDate;
        }

        const promises = await prisma.promiseToPay.findMany({
            where,
            include: {
                client: { select: { id: true, firstName: true, lastName: true } },
            },
        });

        const total = promises.length;
        const fulfilled = promises.filter(p => p.status === 'FULFILLED');
        const broken = promises.filter(p => p.status === 'BROKEN');
        const pending = promises.filter(p => p.status === 'PENDING');

        // Calcular promedio de días para cumplir
        let totalDaysToFulfill = 0;
        let fulfilledWithDates = 0;
        for (const p of fulfilled) {
            const created = new Date(p.createdAt);
            const promised = new Date(p.promiseDate);
            const days = Math.floor((promised.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
            if (days >= 0) {
                totalDaysToFulfill += days;
                fulfilledWithDates++;
            }
        }

        // Top deudores con promesas rotas
        const defaulterMap = new Map<string, { clientName: string; count: number }>();
        for (const p of broken) {
            const key = p.clientId;
            const existing = defaulterMap.get(key);
            if (existing) {
                existing.count++;
            } else {
                defaulterMap.set(key, {
                    clientName: `${p.client.firstName} ${p.client.lastName}`,
                    count: 1,
                });
            }
        }

        const topDefaulters = Array.from(defaulterMap.entries())
            .map(([clientId, data]) => ({ clientId, ...data, brokenCount: data.count }))
            .sort((a, b) => b.brokenCount - a.brokenCount)
            .slice(0, 10);

        return {
            totalPromises: total,
            fulfilled: fulfilled.length,
            broken: broken.length,
            pending: pending.length,
            fulfillmentRate: total > 0 ? Number(((fulfilled.length / total) * 100).toFixed(1)) : 0,
            totalAmountPromised: promises.reduce((s, p) => s + Number(p.amount), 0),
            totalAmountFulfilled: fulfilled.reduce((s, p) => s + Number(p.amount), 0),
            averageDaysToFulfill: fulfilledWithDates > 0 ? Math.round(totalDaysToFulfill / fulfilledWithDates) : 0,
            topDefaulters,
        };
    },
};

export default promiseToPayService;
