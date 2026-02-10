
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { SubscriptionsService } from '@/lib/billing/subscriptions';
import { LimitsService } from '@/lib/billing/limits';

export const dynamic = 'force-dynamic';

/**
 * Endpoint consolidado para el Portal de Billing del Tenant
 * Retorna:
 * 1. Detalles de la suscripción actual y el plan
 * 2. Estado de uso de límites en tiempo real
 * 3. Historial de facturas (Invoices)
 */
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || !session.user.tenantId) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const tenantId = session.user.tenantId;

        const [summary, limitsStatus, invoices] = await Promise.all([
            SubscriptionsService.getSubscriptionSummary(tenantId),
            LimitsService.getAllLimitsStatus(tenantId),
            prisma.invoice.findMany({
                where: {
                    subscription: { tenantId }
                },
                orderBy: { createdAt: 'desc' },
                take: 12
            })
        ]);

        if (!summary) {
            return NextResponse.json({
                error: 'No se encontró suscripción activa para este tenant'
            }, { status: 404 });
        }

        return NextResponse.json({
            subscription: {
                plan: summary.subscription.plan.displayName,
                status: summary.subscription.status,
                amount: Number(summary.subscription.plan.priceMonthly),
                currency: summary.subscription.plan.currency,
                nextBilling: summary.subscription.currentPeriodEnd,
                paymentMethod: summary.subscription.paymentMethod,
                isTrialing: summary.isTrialing,
                daysRemaining: summary.daysRemaining
            },
            usage: {
                users: {
                    current: limitsStatus.resources.users.current,
                    limit: limitsStatus.resources.users.limit
                },
                loans: {
                    current: limitsStatus.resources.loans.current,
                    limit: limitsStatus.resources.loans.limit
                },
                clients: {
                    current: limitsStatus.resources.clients.current,
                    limit: limitsStatus.resources.clients.limit
                },
                storage: {
                    current: limitsStatus.resources.storage.current,
                    limit: limitsStatus.resources.storage.limit
                }
            },
            history: invoices.map(inv => ({
                id: inv.id,
                date: inv.createdAt,
                amount: Number(inv.amount),
                status: inv.status,
                invoiceNumber: inv.invoiceNumber,
                pdfUrl: inv.invoicePdf
            }))
        });

    } catch (error) {
        console.error('Error fetching billing portal data:', error);
        return NextResponse.json(
            { error: 'Error al obtener datos de facturación' },
            { status: 500 }
        );
    }
}
