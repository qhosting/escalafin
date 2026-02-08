/**
 * Servicio de Planes de Suscripción SaaS
 * Gestiona los planes disponibles y sus límites
 */

import { prisma } from '@/lib/prisma';
import type { Plan } from '@prisma/client';

// ============================================
// TIPOS Y CONSTANTES
// ============================================

export interface PlanLimits {
    users: number;        // -1 = ilimitado
    loans: number;
    clients: number;
    storageGB: number;
    apiCalls: number;
    smsPerMonth: number;
    whatsappPerMonth: number;
    customReports: boolean;
    apiAccess: boolean;
    whiteLabeling: boolean;
    prioritySupport: boolean;
    ssoEnabled: boolean;
    customDomain: boolean;
}

export interface PlanFeature {
    key: string;
    name: string;
    description?: string;
    included: boolean;
}

// Límites por defecto para cada plan
export const DEFAULT_PLAN_LIMITS: Record<string, PlanLimits> = {
    starter: {
        users: 3,
        loans: 100,
        clients: 200,
        storageGB: 1,
        apiCalls: 1000,
        smsPerMonth: 500,
        whatsappPerMonth: 500,
        customReports: false,
        apiAccess: false,
        whiteLabeling: false,
        prioritySupport: false,
        ssoEnabled: false,
        customDomain: false
    },
    professional: {
        users: 10,
        loans: 500,
        clients: 1000,
        storageGB: 10,
        apiCalls: 10000,
        smsPerMonth: 2000,
        whatsappPerMonth: 2000,
        customReports: true,
        apiAccess: true,
        whiteLabeling: false,
        prioritySupport: false,
        ssoEnabled: false,
        customDomain: true
    },
    business: {
        users: 25,
        loans: 2000,
        clients: 5000,
        storageGB: 50,
        apiCalls: 50000,
        smsPerMonth: 10000,
        whatsappPerMonth: 10000,
        customReports: true,
        apiAccess: true,
        whiteLabeling: true,
        prioritySupport: true,
        ssoEnabled: false,
        customDomain: true
    },
    enterprise: {
        users: -1,
        loans: -1,
        clients: -1,
        storageGB: -1,
        apiCalls: -1,
        smsPerMonth: -1,
        whatsappPerMonth: -1,
        customReports: true,
        apiAccess: true,
        whiteLabeling: true,
        prioritySupport: true,
        ssoEnabled: true,
        customDomain: true
    },
    // Plan legacy para tenants existentes
    legacy: {
        users: -1,
        loans: -1,
        clients: -1,
        storageGB: -1,
        apiCalls: -1,
        smsPerMonth: -1,
        whatsappPerMonth: -1,
        customReports: true,
        apiAccess: true,
        whiteLabeling: true,
        prioritySupport: true,
        ssoEnabled: true,
        customDomain: true
    }
};

// Features disponibles en español
export const PLAN_FEATURES = {
    starter: [
        'Hasta 3 usuarios',
        'Hasta 100 préstamos/mes',
        'Hasta 200 clientes',
        '1 GB almacenamiento',
        '500 mensajes WhatsApp/mes',
        '500 SMS/mes',
        'Soporte por email',
        'Dashboard básico'
    ],
    professional: [
        'Hasta 10 usuarios',
        'Hasta 500 préstamos/mes',
        'Hasta 1,000 clientes',
        '10 GB almacenamiento',
        '2,000 mensajes WhatsApp/mes',
        '2,000 SMS/mes',
        'Acceso a API',
        'Reportes personalizados',
        'Dominio personalizado',
        'Soporte prioritario por chat'
    ],
    business: [
        'Hasta 25 usuarios',
        'Hasta 2,000 préstamos/mes',
        'Hasta 5,000 clientes',
        '50 GB almacenamiento',
        '10,000 mensajes WhatsApp/mes',
        '10,000 SMS/mes',
        'API ilimitada',
        'White-labeling completo',
        'Webhooks configurables',
        'Soporte telefónico 24/7'
    ],
    enterprise: [
        'Usuarios ilimitados',
        'Préstamos ilimitados',
        'Clientes ilimitados',
        'Almacenamiento ilimitado',
        'Mensajes ilimitados',
        'SSO/SAML',
        'SLA personalizado',
        'Gerente de cuenta dedicado',
        'Implementación guiada',
        'Integraciones personalizadas'
    ]
};

// ============================================
// SERVICIO DE PLANES
// ============================================

export class PlansService {

    /**
     * Obtiene todos los planes activos
     */
    static async getActivePlans(): Promise<Plan[]> {
        return prisma.plan.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
        });
    }

    /**
     * Obtiene un plan por su nombre
     */
    static async getPlanByName(name: string): Promise<Plan | null> {
        return prisma.plan.findUnique({
            where: { name }
        });
    }

    /**
     * Obtiene un plan por su ID
     */
    static async getPlanById(id: string): Promise<Plan | null> {
        return prisma.plan.findUnique({
            where: { id }
        });
    }

    /**
     * Parsea los límites de un plan
     */
    static parseLimits(plan: Plan): PlanLimits {
        try {
            return JSON.parse(plan.limits) as PlanLimits;
        } catch {
            return DEFAULT_PLAN_LIMITS[plan.name] || DEFAULT_PLAN_LIMITS.starter;
        }
    }

    /**
     * Parsea las features de un plan
     */
    static parseFeatures(plan: Plan): string[] {
        try {
            return JSON.parse(plan.features) as string[];
        } catch {
            return PLAN_FEATURES[plan.name as keyof typeof PLAN_FEATURES] || [];
        }
    }

    /**
     * Verifica si un plan tiene una feature específica
     */
    static hasFeature(limits: PlanLimits, feature: keyof PlanLimits): boolean {
        const value = limits[feature];
        if (typeof value === 'boolean') return value;
        if (typeof value === 'number') return value !== 0;
        return false;
    }

    /**
     * Verifica si un límite es ilimitado
     */
    static isUnlimited(limit: number): boolean {
        return limit === -1;
    }

    /**
     * Seed de planes por defecto
     */
    static async seedDefaultPlans(): Promise<void> {
        const plans = [
            {
                name: 'starter',
                displayName: 'Starter',
                description: 'Ideal para pequeñas financieras y emprendedores',
                priceMonthly: 499,
                priceYearly: 4990,
                currency: 'MXN',
                features: JSON.stringify(PLAN_FEATURES.starter),
                limits: JSON.stringify(DEFAULT_PLAN_LIMITS.starter),
                isActive: true,
                isPopular: false,
                sortOrder: 1,
                trialDays: 14
            },
            {
                name: 'professional',
                displayName: 'Profesional',
                description: 'Para financieras en crecimiento',
                priceMonthly: 1499,
                priceYearly: 14990,
                currency: 'MXN',
                features: JSON.stringify(PLAN_FEATURES.professional),
                limits: JSON.stringify(DEFAULT_PLAN_LIMITS.professional),
                isActive: true,
                isPopular: true,
                sortOrder: 2,
                trialDays: 14
            },
            {
                name: 'business',
                displayName: 'Business',
                description: 'Para financieras establecidas con alta demanda',
                priceMonthly: 3999,
                priceYearly: 39990,
                currency: 'MXN',
                features: JSON.stringify(PLAN_FEATURES.business),
                limits: JSON.stringify(DEFAULT_PLAN_LIMITS.business),
                isActive: true,
                isPopular: false,
                sortOrder: 3,
                trialDays: 14
            },
            {
                name: 'enterprise',
                displayName: 'Enterprise',
                description: 'Solución personalizada para grandes organizaciones',
                priceMonthly: 0, // Precio a convenir
                priceYearly: 0,
                currency: 'MXN',
                features: JSON.stringify(PLAN_FEATURES.enterprise),
                limits: JSON.stringify(DEFAULT_PLAN_LIMITS.enterprise),
                isActive: true,
                isPopular: false,
                sortOrder: 4,
                trialDays: 30
            },
            {
                name: 'legacy',
                displayName: 'Legacy',
                description: 'Plan heredado para tenants existentes',
                priceMonthly: 0,
                priceYearly: 0,
                currency: 'MXN',
                features: JSON.stringify(PLAN_FEATURES.enterprise),
                limits: JSON.stringify(DEFAULT_PLAN_LIMITS.legacy),
                isActive: false, // No visible para nuevos usuarios
                isPopular: false,
                sortOrder: 99,
                trialDays: 0
            }
        ];

        for (const plan of plans) {
            await prisma.plan.upsert({
                where: { name: plan.name },
                update: plan,
                create: plan
            });
        }

        console.log('✅ Planes sembrados correctamente');
    }

    /**
     * Compara dos planes y devuelve si es upgrade o downgrade
     */
    static comparePlans(currentPlanName: string, newPlanName: string): 'upgrade' | 'downgrade' | 'same' {
        const order = ['starter', 'professional', 'business', 'enterprise'];
        const currentIndex = order.indexOf(currentPlanName);
        const newIndex = order.indexOf(newPlanName);

        if (currentIndex === newIndex) return 'same';
        return newIndex > currentIndex ? 'upgrade' : 'downgrade';
    }
}

export default PlansService;
