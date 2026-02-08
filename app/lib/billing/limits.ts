/**
 * Servicio de Verificación de Límites
 * Verifica que los tenants no excedan los límites de su plan
 */

import { SubscriptionsService } from './subscriptions';
import { UsageTracker, getCurrentPeriod } from './usage-tracker';
import { PlansService, type PlanLimits } from './plans';
import { NextResponse } from 'next/server';

// ============================================
// TIPOS
// ============================================

export type LimitableResource =
    | 'users'
    | 'loans'
    | 'clients'
    | 'storage'
    | 'apiCalls'
    | 'sms'
    | 'whatsapp'
    | 'reports';

export interface LimitCheckResult {
    allowed: boolean;
    current: number;
    limit: number;
    isUnlimited: boolean;
    percentUsed: number;
    resource: LimitableResource;
    message?: string;
}

export interface AllLimitsStatus {
    planName: string;
    planDisplayName: string;
    isTrialing: boolean;
    resources: Record<LimitableResource, LimitCheckResult>;
    overLimit: LimitableResource[];
    nearLimit: LimitableResource[]; // > 80%
}

export class TenantLimitExceededError extends Error {
    resource: LimitableResource;
    current: number;
    limit: number;

    constructor(resource: LimitableResource, current: number, limit: number) {
        super(`Límite excedido para ${resource}: ${current}/${limit}`);
        this.name = 'TenantLimitExceededError';
        this.resource = resource;
        this.current = current;
        this.limit = limit;
    }
}

// ============================================
// MAPEO DE RECURSOS A MÉTRICAS
// ============================================

const RESOURCE_TO_USAGE = {
    users: 'usersCount',
    loans: 'loansCount',
    clients: 'clientsCount',
    storage: 'storageBytes',
    apiCalls: 'apiCalls',
    sms: 'smsCount',
    whatsapp: 'whatsappCount',
    reports: 'reportsCount'
} as const;

const RESOURCE_TO_LIMIT = {
    users: 'users',
    loans: 'loans',
    clients: 'clients',
    storage: 'storageGB', // Nota: storage está en GB en limits
    apiCalls: 'apiCalls',
    sms: 'smsPerMonth',
    whatsapp: 'whatsappPerMonth',
    reports: 'customReports' // Boolean, no número
} as const;

// ============================================
// SERVICIO DE LÍMITES
// ============================================

export class LimitsService {

    /**
     * Verifica si un tenant puede usar un recurso específico
     */
    static async checkLimit(
        tenantId: string,
        resource: LimitableResource,
        increment: number = 1
    ): Promise<LimitCheckResult> {
        const limits = await SubscriptionsService.getTenantLimits(tenantId);
        const usage = await UsageTracker.getOrCreateUsage(tenantId);

        const usageField = RESOURCE_TO_USAGE[resource];
        const limitField = RESOURCE_TO_LIMIT[resource];

        let current = Number(usage[usageField]) || 0;
        let limit = (limits as any)[limitField];

        // Storage es especial: convertir bytes a GB
        if (resource === 'storage') {
            current = Number(usage.storageBytes) / (1024 * 1024 * 1024); // Bytes a GB
        }

        // Reports es boolean
        if (resource === 'reports' && typeof limit === 'boolean') {
            return {
                allowed: limit as boolean,
                current: 0,
                limit: limit ? -1 : 0,
                isUnlimited: limit as boolean,
                percentUsed: 0,
                resource,
                message: limit ? undefined : 'Los reportes personalizados no están incluidos en tu plan'
            };
        }

        const isUnlimited = limit === -1;
        const newTotal = current + increment;
        const allowed = isUnlimited || newTotal <= limit;
        const percentUsed = isUnlimited ? 0 : Math.round((current / limit) * 100);

        return {
            allowed,
            current: Math.round(current),
            limit,
            isUnlimited,
            percentUsed,
            resource,
            message: allowed
                ? undefined
                : `Has alcanzado el límite de ${this.getResourceName(resource)} de tu plan`
        };
    }

    /**
     * Verifica un límite y lanza error si se excede
     */
    static async enforceLimit(
        tenantId: string,
        resource: LimitableResource,
        increment: number = 1
    ): Promise<void> {
        const check = await this.checkLimit(tenantId, resource, increment);

        if (!check.allowed) {
            throw new TenantLimitExceededError(resource, check.current, check.limit);
        }
    }

    /**
     * Obtiene el estado de todos los límites de un tenant
     */
    static async getAllLimitsStatus(tenantId: string): Promise<AllLimitsStatus> {
        const subscription = await SubscriptionsService.getSubscription(tenantId);
        const limits = subscription
            ? PlansService.parseLimits(subscription.plan)
            : await SubscriptionsService.getTenantLimits(tenantId);

        const usage = await UsageTracker.getOrCreateUsage(tenantId);

        const resources: Record<LimitableResource, LimitCheckResult> = {} as any;
        const overLimit: LimitableResource[] = [];
        const nearLimit: LimitableResource[] = [];

        const allResources: LimitableResource[] = [
            'users', 'loans', 'clients', 'storage',
            'apiCalls', 'sms', 'whatsapp', 'reports'
        ];

        for (const resource of allResources) {
            const check = await this.checkLimit(tenantId, resource);
            resources[resource] = check;

            if (!check.allowed && !check.isUnlimited) {
                overLimit.push(resource);
            } else if (check.percentUsed >= 80 && !check.isUnlimited) {
                nearLimit.push(resource);
            }
        }

        return {
            planName: subscription?.plan.name || 'starter',
            planDisplayName: subscription?.plan.displayName || 'Starter',
            isTrialing: subscription?.status === 'TRIALING',
            resources,
            overLimit,
            nearLimit
        };
    }

    /**
     * Middleware para verificar límites antes de operaciones
     */
    static async middleware(
        tenantId: string,
        resource: LimitableResource
    ): Promise<NextResponse | null> {
        try {
            const check = await this.checkLimit(tenantId, resource);

            if (!check.allowed) {
                return NextResponse.json(
                    {
                        error: 'Límite excedido',
                        code: 'LIMIT_EXCEEDED',
                        resource,
                        current: check.current,
                        limit: check.limit,
                        message: check.message,
                        upgradeUrl: '/admin/billing/upgrade'
                    },
                    {
                        status: 402, // Payment Required
                        headers: {
                            'X-Limit-Resource': resource,
                            'X-Limit-Current': String(check.current),
                            'X-Limit-Max': String(check.limit)
                        }
                    }
                );
            }

            return null; // Continuar con la request
        } catch (error) {
            console.error('Error checking limits:', error);
            return null; // En caso de error, permitir la operación
        }
    }

    /**
     * Verifica si una feature está habilitada para el plan
     */
    static async hasFeature(
        tenantId: string,
        feature: keyof PlanLimits
    ): Promise<boolean> {
        const limits = await SubscriptionsService.getTenantLimits(tenantId);
        return PlansService.hasFeature(limits, feature);
    }

    /**
     * Nombre legible del recurso en español
     */
    static getResourceName(resource: LimitableResource): string {
        const names: Record<LimitableResource, string> = {
            users: 'usuarios',
            loans: 'préstamos',
            clients: 'clientes',
            storage: 'almacenamiento',
            apiCalls: 'llamadas a la API',
            sms: 'mensajes SMS',
            whatsapp: 'mensajes de WhatsApp',
            reports: 'reportes personalizados'
        };
        return names[resource] || resource;
    }

    /**
     * Obtiene sugerencias de upgrade basadas en uso
     */
    static async getUpgradeSuggestion(tenantId: string): Promise<{
        shouldUpgrade: boolean;
        reason: string;
        suggestedPlan: string;
    } | null> {
        const status = await this.getAllLimitsStatus(tenantId);

        if (status.overLimit.length > 0) {
            return {
                shouldUpgrade: true,
                reason: `Has excedido el límite de ${status.overLimit.map(r => this.getResourceName(r)).join(', ')}`,
                suggestedPlan: this.getNextPlan(status.planName)
            };
        }

        if (status.nearLimit.length >= 2) {
            return {
                shouldUpgrade: true,
                reason: `Estás cerca del límite en ${status.nearLimit.map(r => this.getResourceName(r)).join(', ')}`,
                suggestedPlan: this.getNextPlan(status.planName)
            };
        }

        return null;
    }

    private static getNextPlan(currentPlan: string): string {
        const planOrder = ['starter', 'professional', 'business', 'enterprise'];
        const currentIndex = planOrder.indexOf(currentPlan);
        return planOrder[Math.min(currentIndex + 1, planOrder.length - 1)];
    }
}

export default LimitsService;
