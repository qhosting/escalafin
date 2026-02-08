/**
 * Servicio de Suscripciones SaaS
 * Gestiona el ciclo de vida completo de las suscripciones de tenants
 */

import { prisma } from '@/lib/prisma';
import { PlansService, DEFAULT_PLAN_LIMITS, type PlanLimits } from './plans';
import type { Subscription, SubscriptionStatus, Plan, Tenant } from '@prisma/client';

// ============================================
// TIPOS
// ============================================

export interface SubscriptionWithPlan extends Subscription {
    plan: Plan;
    tenant?: Tenant;
}

export interface CreateSubscriptionInput {
    tenantId: string;
    planId: string;
    trialDays?: number;
    billingEmail?: string;
    billingName?: string;
    paymentMethod?: string;
}

export interface SubscriptionSummary {
    subscription: SubscriptionWithPlan;
    limits: PlanLimits;
    daysRemaining: number;
    isTrialing: boolean;
    isCanceled: boolean;
    isPastDue: boolean;
}

// ============================================
// SERVICIO DE SUSCRIPCIONES
// ============================================

export class SubscriptionsService {

    /**
     * Crea una nueva suscripción para un tenant
     */
    static async createSubscription(input: CreateSubscriptionInput): Promise<Subscription> {
        const { tenantId, planId, trialDays = 14, billingEmail, billingName, paymentMethod } = input;

        // Verificar que no existe una suscripción activa
        const existing = await prisma.subscription.findUnique({
            where: { tenantId }
        });

        if (existing) {
            throw new Error('Este tenant ya tiene una suscripción activa');
        }

        // Obtener el plan
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) {
            throw new Error('Plan no encontrado');
        }

        const now = new Date();
        const trialEnd = new Date(now.getTime() + trialDays * 24 * 60 * 60 * 1000);
        const periodEnd = trialEnd; // El periodo inicial es el trial

        return prisma.subscription.create({
            data: {
                tenantId,
                planId,
                status: trialDays > 0 ? 'TRIALING' : 'ACTIVE',
                currentPeriodStart: now,
                currentPeriodEnd: periodEnd,
                trialEndsAt: trialDays > 0 ? trialEnd : null,
                billingEmail,
                billingName,
                paymentMethod: (paymentMethod as any) || 'MANUAL'
            }
        });
    }

    /**
     * Obtiene la suscripción de un tenant con información del plan
     */
    static async getSubscription(tenantId: string): Promise<SubscriptionWithPlan | null> {
        return prisma.subscription.findUnique({
            where: { tenantId },
            include: { plan: true }
        });
    }

    /**
     * Obtiene un resumen completo de la suscripción
     */
    static async getSubscriptionSummary(tenantId: string): Promise<SubscriptionSummary | null> {
        const subscription = await this.getSubscription(tenantId);

        if (!subscription) return null;

        const now = new Date();
        const daysRemaining = Math.ceil(
            (subscription.currentPeriodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        const limits = PlansService.parseLimits(subscription.plan);

        return {
            subscription,
            limits,
            daysRemaining: Math.max(0, daysRemaining),
            isTrialing: subscription.status === 'TRIALING',
            isCanceled: subscription.status === 'CANCELED',
            isPastDue: subscription.status === 'PAST_DUE'
        };
    }

    /**
     * Cambia el plan de una suscripción
     */
    static async changePlan(tenantId: string, newPlanId: string): Promise<Subscription> {
        const subscription = await this.getSubscription(tenantId);

        if (!subscription) {
            throw new Error('Suscripción no encontrada');
        }

        const newPlan = await prisma.plan.findUnique({ where: { id: newPlanId } });
        if (!newPlan) {
            throw new Error('Plan no encontrado');
        }

        const changeType = PlansService.comparePlans(subscription.plan.name, newPlan.name);

        // Actualizar el plan
        const updated = await prisma.subscription.update({
            where: { tenantId },
            data: {
                planId: newPlanId,
                // En un upgrade, el cambio es inmediato
                // En un downgrade, aplicaría al final del periodo
                status: subscription.status === 'TRIALING' ? 'TRIALING' : 'ACTIVE',
                metadata: JSON.stringify({
                    previousPlanId: subscription.planId,
                    changeType,
                    changedAt: new Date().toISOString()
                })
            }
        });

        // TODO: Crear una factura prorrateada si es upgrade

        return updated;
    }

    /**
     * Cancela una suscripción
     */
    static async cancelSubscription(
        tenantId: string,
        reason?: string,
        cancelImmediately: boolean = false
    ): Promise<Subscription> {
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId }
        });

        if (!subscription) {
            throw new Error('Suscripción no encontrada');
        }

        return prisma.subscription.update({
            where: { tenantId },
            data: {
                status: cancelImmediately ? 'CANCELED' : subscription.status,
                canceledAt: new Date(),
                cancelAtPeriodEnd: !cancelImmediately,
                cancelReason: reason
            }
        });
    }

    /**
     * Reactiva una suscripción cancelada
     */
    static async reactivateSubscription(tenantId: string): Promise<Subscription> {
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId }
        });

        if (!subscription) {
            throw new Error('Suscripción no encontrada');
        }

        if (subscription.status !== 'CANCELED' && !subscription.cancelAtPeriodEnd) {
            throw new Error('La suscripción no está cancelada');
        }

        return prisma.subscription.update({
            where: { tenantId },
            data: {
                status: 'ACTIVE',
                canceledAt: null,
                cancelAtPeriodEnd: false,
                cancelReason: null
            }
        });
    }

    /**
     * Renueva el periodo de una suscripción (llamado después de pago exitoso)
     */
    static async renewSubscription(tenantId: string, months: number = 1): Promise<Subscription> {
        const subscription = await prisma.subscription.findUnique({
            where: { tenantId }
        });

        if (!subscription) {
            throw new Error('Suscripción no encontrada');
        }

        const now = new Date();
        const periodStart = subscription.currentPeriodEnd > now
            ? subscription.currentPeriodEnd
            : now;

        const periodEnd = new Date(periodStart);
        periodEnd.setMonth(periodEnd.getMonth() + months);

        return prisma.subscription.update({
            where: { tenantId },
            data: {
                status: 'ACTIVE',
                currentPeriodStart: periodStart,
                currentPeriodEnd: periodEnd,
                trialEndsAt: null // Ya no está en trial
            }
        });
    }

    /**
     * Marca una suscripción como vencida
     */
    static async markAsPastDue(tenantId: string): Promise<Subscription> {
        return prisma.subscription.update({
            where: { tenantId },
            data: { status: 'PAST_DUE' }
        });
    }

    /**
     * Procesa suscripciones que expiraron su trial
     */
    static async processExpiredTrials(): Promise<number> {
        const now = new Date();

        const expiredTrials = await prisma.subscription.findMany({
            where: {
                status: 'TRIALING',
                trialEndsAt: { lte: now }
            }
        });

        let processed = 0;
        for (const sub of expiredTrials) {
            await prisma.subscription.update({
                where: { id: sub.id },
                data: {
                    status: 'PAST_DUE' // Requiere pago
                }
            });
            processed++;
        }

        return processed;
    }

    /**
     * Procesa suscripciones canceladas al final del periodo
     */
    static async processCanceledAtPeriodEnd(): Promise<number> {
        const now = new Date();

        const toCancel = await prisma.subscription.findMany({
            where: {
                cancelAtPeriodEnd: true,
                currentPeriodEnd: { lte: now }
            }
        });

        let processed = 0;
        for (const sub of toCancel) {
            await prisma.subscription.update({
                where: { id: sub.id },
                data: { status: 'CANCELED' }
            });
            processed++;
        }

        return processed;
    }

    /**
     * Obtiene los límites actuales de un tenant
     */
    static async getTenantLimits(tenantId: string): Promise<PlanLimits> {
        const subscription = await this.getSubscription(tenantId);

        if (!subscription) {
            // Sin suscripción, usar límites de starter
            return DEFAULT_PLAN_LIMITS.starter;
        }

        return PlansService.parseLimits(subscription.plan);
    }

    /**
     * Crea suscripciones legacy para tenants existentes sin suscripción
     */
    static async migrateLegacyTenants(): Promise<number> {
        // Buscar el plan legacy
        let legacyPlan = await prisma.plan.findUnique({
            where: { name: 'legacy' }
        });

        if (!legacyPlan) {
            // Crear plan legacy si no existe
            legacyPlan = await prisma.plan.create({
                data: {
                    name: 'legacy',
                    displayName: 'Legacy',
                    description: 'Plan heredado para tenants existentes',
                    priceMonthly: 0,
                    currency: 'MXN',
                    features: JSON.stringify([]),
                    limits: JSON.stringify(DEFAULT_PLAN_LIMITS.legacy),
                    isActive: false,
                    sortOrder: 99
                }
            });
        }

        // Buscar tenants sin suscripción
        const tenantsWithoutSubscription = await prisma.tenant.findMany({
            where: {
                subscription: null
            }
        });

        let migrated = 0;
        for (const tenant of tenantsWithoutSubscription) {
            await prisma.subscription.create({
                data: {
                    tenantId: tenant.id,
                    planId: legacyPlan.id,
                    status: 'ACTIVE',
                    currentPeriodStart: new Date(),
                    currentPeriodEnd: new Date('2099-12-31'), // "Para siempre"
                    paymentMethod: 'MANUAL'
                }
            });
            migrated++;
        }

        console.log(`✅ Migrados ${migrated} tenants al plan legacy`);
        return migrated;
    }
}

export default SubscriptionsService;
