
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
                        console.log(`[SUBS_NOTIF] Notificación Email enviada a ${admin.email} para ${sub.tenant.name}`);

                        // Notificación por WhatsApp
                        if (admin.phone) {
                            try {
                                const { WahaService } = await import('@/lib/waha');
                                const waha = new WahaService();
                                const message = `🔔 *Aviso de Vencimiento - EscalaFin*\n\nHola ${admin.firstName},\n\nTu suscripción para *${sub.tenant.name}* vencerá en *3 días*.\n\nPara evitar interrupciones, asegura que tu método de pago esté actualizado.\n\n_EscalaFin SaaS_`;
                                await waha.sendRawMessage(admin.phone, message);
                                console.log(`[SUBS_NOTIF] Notificación WhatsApp enviada a ${admin.phone}`);
                            } catch (wahaError) {
                                console.error(`[SUBS_NOTIF_WAHA_ERROR] para ${admin.phone}:`, wahaError);
                            }
                        }
                    } catch (mailError) {
                        console.error(`[SUBS_NOTIF_ERROR] Error enviando notificaciones a ${admin.email}:`, mailError);
                    }
                }
            }
        } catch (error) {
            console.error('[SUBS_NOTIF_CRITICAL_ERROR]', error);
        }
    }
}
