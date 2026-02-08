/**
 * API Route: Uso del Tenant
 * GET /api/billing/usage - Obtiene el uso actual y límites
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { LimitsService } from '@/lib/billing/limits';
import { UsageTracker, getCurrentPeriod } from '@/lib/billing/usage-tracker';

/**
 * GET /api/billing/usage
 * Obtiene el uso actual y estado de límites del tenant
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const includeHistory = searchParams.get('history') === 'true';
        const historyMonths = parseInt(searchParams.get('months') || '6', 10);

        // Obtener estado de límites
        const limitsStatus = await LimitsService.getAllLimitsStatus(session.user.tenantId);

        // Obtener sugerencia de upgrade si aplica
        const upgradeSuggestion = await LimitsService.getUpgradeSuggestion(session.user.tenantId);

        // Obtener uso del periodo actual
        const currentPeriod = getCurrentPeriod();
        const currentUsage = await UsageTracker.getOrCreateUsage(session.user.tenantId, currentPeriod);

        const response: any = {
            success: true,
            currentPeriod,
            plan: {
                name: limitsStatus.planName,
                displayName: limitsStatus.planDisplayName,
                isTrialing: limitsStatus.isTrialing
            },
            usage: {
                users: limitsStatus.resources.users,
                loans: limitsStatus.resources.loans,
                clients: limitsStatus.resources.clients,
                storage: limitsStatus.resources.storage,
                apiCalls: limitsStatus.resources.apiCalls,
                sms: limitsStatus.resources.sms,
                whatsapp: limitsStatus.resources.whatsapp,
                reports: limitsStatus.resources.reports
            },
            alerts: {
                overLimit: limitsStatus.overLimit.map(r => ({
                    resource: r,
                    name: LimitsService.getResourceName(r)
                })),
                nearLimit: limitsStatus.nearLimit.map(r => ({
                    resource: r,
                    name: LimitsService.getResourceName(r),
                    percentUsed: limitsStatus.resources[r].percentUsed
                }))
            },
            upgradeSuggestion
        };

        // Agregar historial si se solicita
        if (includeHistory) {
            const history = await UsageTracker.getUsageHistory(
                session.user.tenantId,
                historyMonths
            );

            response.history = history.map(h => ({
                period: h.period,
                users: h.usersCount,
                loans: h.loansCount,
                clients: h.clientsCount,
                storage: Number(h.storageBytes),
                apiCalls: h.apiCalls,
                sms: h.smsCount,
                whatsapp: h.whatsappCount,
                reports: h.reportsCount
            }));
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('Error fetching usage:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener el uso' },
            { status: 500 }
        );
    }
}

/**
 * POST /api/billing/usage/recalculate
 * Recalcula el uso actual (solo admins)
 */
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 403 }
            );
        }

        const usage = await UsageTracker.recalculateUsage(session.user.tenantId);

        return NextResponse.json({
            success: true,
            message: 'Uso recalculado correctamente',
            usage: {
                period: usage.period,
                users: usage.usersCount,
                loans: usage.loansCount,
                clients: usage.clientsCount,
                storage: Number(usage.storageBytes)
            }
        });

    } catch (error) {
        console.error('Error recalculating usage:', error);
        return NextResponse.json(
            { success: false, error: 'Error al recalcular el uso' },
            { status: 500 }
        );
    }
}
