/**
 * API Route: Suscripción del Tenant
 * GET /api/billing/subscription - Obtiene la suscripción actual
 * PUT /api/billing/subscription - Cambia el plan
 * DELETE /api/billing/subscription - Cancela la suscripción
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionsService } from '@/lib/billing/subscriptions';
import { PlansService } from '@/lib/billing/plans';

/**
 * GET /api/billing/subscription
 * Obtiene la suscripción actual del tenant
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

        const summary = await SubscriptionsService.getSubscriptionSummary(session.user.tenantId);

        if (!summary) {
            return NextResponse.json(
                { success: false, error: 'Sin suscripción activa' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            subscription: {
                id: summary.subscription.id,
                status: summary.subscription.status,
                currentPeriodStart: summary.subscription.currentPeriodStart,
                currentPeriodEnd: summary.subscription.currentPeriodEnd,
                trialEndsAt: summary.subscription.trialEndsAt,
                canceledAt: summary.subscription.canceledAt,
                cancelAtPeriodEnd: summary.subscription.cancelAtPeriodEnd,
                plan: {
                    id: summary.subscription.plan.id,
                    name: summary.subscription.plan.name,
                    displayName: summary.subscription.plan.displayName,
                    priceMonthly: Number(summary.subscription.plan.priceMonthly)
                }
            },
            limits: summary.limits,
            daysRemaining: summary.daysRemaining,
            isTrialing: summary.isTrialing,
            isCanceled: summary.isCanceled,
            isPastDue: summary.isPastDue
        });

    } catch (error) {
        console.error('Error fetching subscription:', error);
        return NextResponse.json(
            { success: false, error: 'Error al obtener la suscripción' },
            { status: 500 }
        );
    }
}

/**
 * PUT /api/billing/subscription
 * Cambia el plan de la suscripción
 */
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Solo administradores pueden cambiar el plan
        if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 403 }
            );
        }

        const body = await request.json();
        const { planId } = body;

        if (!planId) {
            return NextResponse.json(
                { success: false, error: 'planId es requerido' },
                { status: 400 }
            );
        }

        // Verificar que el plan existe
        const plan = await PlansService.getPlanById(planId);
        if (!plan) {
            return NextResponse.json(
                { success: false, error: 'Plan no encontrado' },
                { status: 404 }
            );
        }

        // Cambiar el plan
        const subscription = await SubscriptionsService.changePlan(
            session.user.tenantId,
            planId
        );

        return NextResponse.json({
            success: true,
            message: 'Plan actualizado correctamente',
            subscription: {
                id: subscription.id,
                planId: subscription.planId,
                status: subscription.status
            }
        });

    } catch (error) {
        console.error('Error changing plan:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Error al cambiar el plan' },
            { status: 500 }
        );
    }
}

/**
 * DELETE /api/billing/subscription
 * Cancela la suscripción
 */
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.tenantId) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }

        // Solo administradores pueden cancelar
        if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json(
                { success: false, error: 'No autorizado' },
                { status: 403 }
            );
        }

        const { searchParams } = new URL(request.url);
        const immediate = searchParams.get('immediate') === 'true';
        const reason = searchParams.get('reason') || undefined;

        const subscription = await SubscriptionsService.cancelSubscription(
            session.user.tenantId,
            reason,
            immediate
        );

        return NextResponse.json({
            success: true,
            message: immediate
                ? 'Suscripción cancelada inmediatamente'
                : 'La suscripción se cancelará al final del periodo actual',
            subscription: {
                id: subscription.id,
                status: subscription.status,
                canceledAt: subscription.canceledAt,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd
            }
        });

    } catch (error) {
        console.error('Error canceling subscription:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Error al cancelar' },
            { status: 500 }
        );
    }
}
