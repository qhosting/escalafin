
import { prisma } from '@/lib/db';
import { InvoiceStatus, SubscriptionStatus } from '@prisma/client';

export class InvoiceService {
    /**
     * Genera facturas para todas las suscripciones que están por vencer o ya vencieron
     * y que no tienen una factura generada para el próximo periodo.
     */
    static async processRecurringBilling() {
        const results = {
            processed: 0,
            generated: 0,
            errors: 0,
            logs: [] as string[]
        };

        try {
            // 1. Obtener suscripciones activas que vencen pronto (ej. hoy o ya vencieron)
            const subscriptions = await prisma.subscription.findMany({
                where: {
                    status: { in: ['ACTIVE', 'TRIALING', 'PAST_DUE'] },
                    currentPeriodEnd: {
                        lte: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) // Vencen en los próximos 2 días
                    }
                },
                include: {
                    tenant: {
                        include: {
                            users: {
                                where: { role: 'ADMIN' },
                                take: 1
                            }
                        }
                    },
                    plan: true,
                    // @ts-ignore
                    addons: {
                        where: { status: 'ACTIVE' },
                        include: { addon: true }
                    },
                    invoices: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                }
            }) as any;

            results.processed = subscriptions.length;

            const { MailService } = await import('@/lib/mail');

            for (const sub of subscriptions) {
                try {
                    // 2. Verificar si ya se generó una factura para este periodo (evitar duplicados)
                    // Si la última factura se generó hace menos de 20 días, probablemente ya cubrimos este mes
                    const lastInvoice = sub.invoices[0];
                    const TWENTY_DAYS_MS = 20 * 24 * 60 * 60 * 1000;

                    if (lastInvoice && (Date.now() - new Date(lastInvoice.createdAt).getTime() < TWENTY_DAYS_MS)) {
                        results.logs.push(`SKIPPED: ${sub.tenant.name} already has a recent invoice.`);
                        continue;
                    }

                    // 3. Calcular montos y items
                    const now = new Date();
                    let totalAmount = Number(sub.plan.priceMonthly);
                    const lineItems = [
                        {
                            description: `Suscripción Plan ${sub.plan.displayName} - Periodo ${now.getMonth() + 1}/${now.getFullYear()}`,
                            amount: Number(sub.plan.priceMonthly),
                            quantity: 1
                        }
                    ];

                    // Agregar Add-ons activos
                    if (sub.addons && sub.addons.length > 0) {
                        for (const subAddon of sub.addons) {
                            const addonPrice = Number(subAddon.addon.priceMonthly);
                            totalAmount += addonPrice;
                            lineItems.push({
                                description: `Add-on: ${subAddon.addon.displayName}`,
                                amount: addonPrice,
                                quantity: 1
                            });
                        }
                    }

                    // Generar nueva factura
                    const invoiceNumber = `AUTO-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}-${sub.tenant.slug.substring(0, 3).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

                    await prisma.invoice.create({
                        data: {
                            subscriptionId: sub.id,
                            invoiceNumber,
                            amount: totalAmount,
                            subtotal: totalAmount,
                            currency: sub.plan.currency || 'MXN',
                            status: 'OPEN',
                            dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 días para pagar
                            lineItems: JSON.stringify(lineItems),
                            notes: `Factura recurrente generada automáticamente.`
                        }
                    });

                    // 4. (Opcional) Si es renovación exitosa manual, actualizaríamos periodEnd.
                    // Por ahora solo generamos la factura. El pago actualizará el periodo.

                    results.generated++;
                    results.logs.push(`GENERATED: Invoice for ${sub.tenant.name} (${sub.plan.name})`);

                    // 5. Notificar por email al administrador del tenant
                    const admin = sub.tenant.users[0];
                    if (admin) {
                        try {
                            const dueDateStr = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString('es-MX');
                            await MailService.sendInvoiceEmail(admin.email, {
                                invoiceNumber,
                                amount: Number(sub.plan.priceMonthly),
                                dueDate: dueDateStr,
                                companyName: sub.tenant.name
                            });
                            results.logs.push(`NOTIFIED: Email sent to ${admin.email}`);
                        } catch (mailError: any) {
                            results.logs.push(`WARNING: Could not send email to ${admin.email}: ${mailError.message}`);
                        }
                    }

                } catch (subError: any) {
                    results.errors++;
                    results.logs.push(`ERROR: Failed for ${sub.tenant.name}: ${subError.message}`);
                }
            }

        } catch (error: any) {
            console.error('Critical error in processRecurringBilling:', error);
            throw error;
        }

        return results;
    }
}
