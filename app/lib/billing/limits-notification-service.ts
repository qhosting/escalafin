
import { LimitsService, type LimitableResource } from './limits';
import { MailService } from '@/lib/mail';
import { prisma } from '@/lib/prisma';
import { redisCache } from '@/lib/redis-cache';

export class LimitsNotificationService {
    /**
     * Verifica si se debe enviar una notificación de límite y la envía si es necesario
     */
    static async checkAndNotify(tenantId: string, resource: LimitableResource): Promise<void> {
        try {
            const status = await LimitsService.checkLimit(tenantId, resource);

            // Si el uso es >= 80% y no se ha notificado hoy para este umbral
            if (status.percentUsed >= 80 && !status.isUnlimited) {
                const threshold = status.percentUsed >= 100 ? 100 : 80;
                const cacheKey = `notif:limit:${tenantId}:${resource}:${threshold}`;

                // Evitar múltiples notificaciones (ej: una por día por umbral)
                const alreadyNotified = await redisCache.get(cacheKey);
                if (alreadyNotified) return;

                // Obtener datos del tenant y admin
                const tenant = await prisma.tenant.findUnique({
                    where: { id: tenantId },
                    include: {
                        users: {
                            where: { role: 'ADMIN' },
                            take: 1
                        }
                    }
                });

                if (!tenant || !tenant.users[0]) return;

                const admin = tenant.users[0];
                const resourceName = LimitsService.getResourceName(resource);

                // Enviar email
                await MailService.sendLimitWarningEmail({
                    to: admin.email,
                    userName: admin.firstName,
                    companyName: tenant.name,
                    resourceName: resourceName,
                    currentUsage: status.current,
                    limit: status.limit,
                    percent: status.percentUsed,
                    upgradeUrl: `${process.env.NEXTAUTH_URL}/admin/billing/subscription`
                });

                // Enviar WhatsApp si tiene teléfono configurado
                if (admin.phone) {
                    try {
                        const { WahaService } = await import('@/lib/waha');
                        const waha = new WahaService();
                        const message = `🔔 *Alerta de Límite - EscalaFin*\n\nHola ${admin.firstName},\n\nTu organización *${tenant.name}* ha alcanzado el *${status.percentUsed}%* del límite de *${resourceName}*.\n\nUso: ${status.current} / ${status.limit === -1 ? 'Ilimitado' : status.limit}\n\nTe recomendamos mejorar tu plan para evitar interrupciones.`;

                        try {
                            await waha.sendRawMessage(admin.phone, message);
                        } catch (e) {
                            console.error('[LIMIT_NOTIF] Error sending WhatsApp:', e);
                        }
                    } catch (err) {
                        console.error('[LIMIT_NOTIF] Waha service not found:', err);
                    }
                }

                // Marcar como notificado por 24 horas
                await redisCache.set(cacheKey, 'true', 86400);

                console.log(`[LIMIT_NOTIF] Warning sent to ${tenant.name} for ${resource} (${status.percentUsed}%)`);
            }
        } catch (error) {
            console.error('[LIMIT_NOTIF_ERROR]', error);
        }
    }
}
