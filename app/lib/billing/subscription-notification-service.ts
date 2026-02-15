
import { prisma } from '@/lib/db';
import { MailService } from '@/lib/mail';

export class SubscriptionNotificationService {
    /**
     * Verifica suscripciones próximas a vencer y envía notificaciones
     */
    static async checkExpirationsAndNotify(): Promise<void> {
        try {
            // 1. Obtener suscripciones activas que vencen en exactamente 3 días
            const threeDaysFromNow = new Date();
            threeDaysFromNow.setDate(threeDaysFromNow.getDate() + 3);

            const startDate = new Date(threeDaysFromNow);
            startDate.setHours(0, 0, 0, 0);
            const endDate = new Date(threeDaysFromNow);
            endDate.setHours(23, 59, 59, 999);

            const expiringSoon = await prisma.subscription.findMany({
                where: {
                    status: 'ACTIVE',
                    currentPeriodEnd: {
                        gte: startDate,
                        lte: endDate
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
                    }
                }
            });

            console.log(`[SUBS_NOTIF] Encontradas ${expiringSoon.length} suscripciones que vencen en 3 días.`);

            for (const sub of expiringSoon) {
                const admin = sub.tenant.users[0];
                if (admin) {
                    try {
                        await MailService.sendSubscriptionExpiringSoon(admin.email, {
                            companyName: sub.tenant.name,
                            daysRemaining: 3,
                            upgradeUrl: `${process.env.NEXTAUTH_URL}/admin/billing/subscription`
                        });
                        console.log(`[SUBS_NOTIF] Notificación enviada a ${admin.email} para ${sub.tenant.name}`);
                    } catch (mailError) {
                        console.error(`[SUBS_NOTIF_ERROR] Error enviando email a ${admin.email}:`, mailError);
                    }
                }
            }
        } catch (error) {
            console.error('[SUBS_NOTIF_CRITICAL_ERROR]', error);
        }
    }
}
