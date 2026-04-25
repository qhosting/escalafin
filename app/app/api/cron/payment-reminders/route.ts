export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { WhatsAppNotificationService } from '@/lib/whatsapp-notification';

/**
 * CRON: Enviar recordatorios de pago por WhatsApp
 * 
 * ESTADO: ⏸️ DESHABILITADO — Sistema en modo prueba.
 * Para activar: cambiar WHATSAPP_REMINDERS_ENABLED=true en variables de entorno.
 * 
 * Lógica:
 *  - 48h antes del pago: recordatorio preventivo
 *  - Día del pago (mañana): recordatorio urgente
 */
export async function POST(request: NextRequest) {
  try {
    // ── Feature Flag ──────────────────────────────────────────────
    const enabled = process.env.WHATSAPP_REMINDERS_ENABLED === 'true';
    if (!enabled) {
      console.log('[CRON-REMINDERS] ⏸️ Sistema en modo prueba. Recordatorios WhatsApp deshabilitados.');
      return NextResponse.json({
        success: true,
        mode: 'DISABLED',
        message: 'Recordatorios WhatsApp deshabilitados. Activa WHATSAPP_REMINDERS_ENABLED=true para enviarlos.',
      });
    }

    // ── Validar cron secret ───────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET || 'escalafin-cron-2026';
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const now = new Date();
    const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Rangos del día (para filtrar "mañana" y "pasado mañana")
    const tomorrow = new Date(in24h);
    tomorrow.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const dayAfter = new Date(in48h);
    dayAfter.setHours(0, 0, 0, 0);
    const dayAfterEnd = new Date(dayAfter);
    dayAfterEnd.setHours(23, 59, 59, 999);

    // ── Buscar cuotas próximas (mañana y pasado mañana) ──────────
    const upcomingInstallments = await (prisma as any).amortizationSchedule.findMany({
      where: {
        isPaid: false,
        paymentDate: {
          gte: tomorrow,
          lte: dayAfterEnd,
        },
        loan: {
          status: 'ACTIVE',
          client: {
            whatsappNotificationsEnabled: true,
            whatsappPaymentReminder: true,
          }
        }
      },
      include: {
        loan: {
          include: {
            client: true,
          }
        }
      }
    });

    let sent = 0;
    let skipped = 0;
    let errors = 0;

    for (const installment of upcomingInstallments) {
      const loan = installment.loan;
      const tenantId = loan.tenantId;

      try {
        const waNotif = new WhatsAppNotificationService(tenantId);
        await waNotif.sendPaymentReminderNotification(loan.id);
        sent++;
      } catch (err) {
        console.error(`[CRON-REMINDERS] Error al enviar a préstamo ${loan.id}:`, err);
        errors++;
      }
    }

    console.log(`[CRON-REMINDERS] ✅ Enviados: ${sent} | Omitidos: ${skipped} | Errores: ${errors}`);

    return NextResponse.json({
      success: true,
      mode: 'ACTIVE',
      executedAt: now.toISOString(),
      sent,
      skipped,
      errors,
      total: upcomingInstallments.length,
    });

  } catch (error: any) {
    console.error('[CRON-REMINDERS] Error fatal:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
