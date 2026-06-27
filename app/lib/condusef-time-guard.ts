/**
 * lib/condusef-time-guard.ts
 *
 * Firewall de Horarios CONDUSEF (Art. 12 REDECO)
 * Disposiciones de cobranza extrajudicial de la CONDUSEF.
 *
 * Regla: Los contactos de cobranza (llamadas, WhatsApp, SMS)
 * SOLO están permitidos entre las 07:00 y las 21:59 hrs
 * en la zona horaria del cliente (default: America/Mexico_City).
 *
 * Fuera de horario: los mensajes se encolan en Redis para enviarse
 * automáticamente al inicio del siguiente período permitido (07:00 hrs).
 *
 * Restricción adicional CONDUSEF:
 * - PROHIBIDO contactar números etiquetados como `tipo_contacto = referencia`
 *   (PersonalReference). Solo se puede contactar al titular del crédito.
 */

import { prisma } from './prisma';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Hora de inicio del período permitido (inclusive) */
const ALLOWED_HOUR_START = 7;

/** Hora de fin del período permitido (inclusive hasta las 21:59) */
const ALLOWED_HOUR_END = 21;

/** Zona horaria de México Central (default) */
const DEFAULT_TIMEZONE = 'America/Mexico_City';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface TimeGuardResult {
  allowed:     boolean;
  currentHour: number;
  timezone:    string;
  reason?:     string;
  queuedAt?:   string;
  executeAt?:  string;
}

export interface QueuedJob {
  jobName:   string;
  payload:   Record<string, unknown>;
  queuedAt:  string;
  executeAt: string;
  tenantId?: string;
}

// ─── Clase principal ──────────────────────────────────────────────────────────

export class ConductsefTimeGuard {

  /**
   * Verifica si el horario actual está dentro del rango permitido por CONDUSEF.
   *
   * @param timezone - Zona horaria del cliente (default: America/Mexico_City)
   * @returns true si está en horario permitido, false si está fuera de horario
   */
  static isAllowedHour(timezone: string = DEFAULT_TIMEZONE): boolean {
    try {
      const now    = new Date();
      const locale = now.toLocaleTimeString('es-MX', {
        timeZone: timezone,
        hour:     '2-digit',
        hour12:   false,
      });
      const hour = parseInt(locale.split(':')[0], 10);
      return hour >= ALLOWED_HOUR_START && hour <= ALLOWED_HOUR_END;
    } catch {
      // Si la zona horaria no es válida, usar UTC y asumir horario permitido
      const hour = new Date().getUTCHours() - 6; // UTC-6 México Central
      return hour >= ALLOWED_HOUR_START && hour <= ALLOWED_HOUR_END;
    }
  }

  /**
   * Calcula el timestamp del próximo inicio del período permitido (07:00 hrs).
   */
  static getNextAllowedTime(timezone: string = DEFAULT_TIMEZONE): Date {
    const now       = new Date();
    const tomorrow  = new Date(now);
    tomorrow.setDate(now.getDate() + 1);

    // Construir 07:00 del día siguiente en la zona horaria correcta
    const targetStr = tomorrow.toLocaleDateString('es-MX', { timeZone: timezone }) + ' 07:00:00';
    const target    = new Date(targetStr);

    // Si la conversión falla, usar las próximas 24h como fallback
    if (isNaN(target.getTime())) {
      const fallback = new Date(now);
      fallback.setHours(now.getHours() + 8);
      return fallback;
    }

    return target;
  }

  /**
   * Verifica si un número de teléfono pertenece a una referencia personal.
   * Según CONDUSEF: PROHIBIDO contactar referencias, solo al titular.
   *
   * @param phone    - Número de teléfono a verificar
   * @param tenantId - ID del tenant para la búsqueda
   * @returns true si es una referencia (BLOQUEAR), false si es el titular (PERMITIR)
   */
  static async isPersonalReference(phone: string, tenantId?: string): Promise<boolean> {
    const cleanPhone = phone.replace(/\D/g, ''); // Solo dígitos

    const reference = await prisma.personalReference.findFirst({
      where: {
        phone:    { contains: cleanPhone.slice(-10) }, // Últimos 10 dígitos
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
    });

    return reference !== null;
  }

  /**
   * Función principal del firewall de horarios.
   *
   * Si está en horario permitido Y el destinatario no es referencia → ejecuta la función.
   * Si está fuera de horario → encola en Redis para ejecución posterior.
   * Si el destinatario es una referencia → bloquea permanentemente.
   *
   * @param fn       - Función a ejecutar (envío de WhatsApp, llamada, etc.)
   * @param jobName  - Nombre del job para la cola
   * @param payload  - Datos del job (para serializar en la cola)
   * @param phone    - Teléfono destinatario (para verificar referencias)
   * @param tenantId - ID del tenant
   */
  static async checkAndExecuteOrQueue(
    fn:        () => Promise<void>,
    jobName:   string,
    payload:   Record<string, unknown>,
    phone?:    string,
    tenantId?: string,
    timezone:  string = DEFAULT_TIMEZONE
  ): Promise<TimeGuardResult> {

    // ── 1. Verificar si es una referencia personal ─────────────────────────
    if (phone) {
      const isRef = await ConductsefTimeGuard.isPersonalReference(phone, tenantId);
      if (isRef) {
        console.warn(
          `[CONDUSEF-GUARD] 🚫 Bloqueado: ${phone} está registrado como referencia personal. ` +
          `Cumplimiento CONDUSEF — Prohibido contactar referencias.`
        );

        // Registrar el intento bloqueado
        await ConductsefTimeGuard.logBlockedContact(phone, 'PERSONAL_REFERENCE', tenantId);

        return {
          allowed:     false,
          currentHour: new Date().getHours(),
          timezone,
          reason:      'PERSONAL_REFERENCE — Contacto prohibido por CONDUSEF. ' +
                       'Solo se puede contactar al titular del crédito.',
        };
      }
    }

    // ── 2. Verificar horario permitido ────────────────────────────────────
    const allowed = ConductsefTimeGuard.isAllowedHour(timezone);
    const now     = new Date();
    const hour    = parseInt(now.toLocaleTimeString('es-MX', {
      timeZone: timezone, hour: '2-digit', hour12: false,
    }).split(':')[0], 10);

    if (!allowed) {
      // Fuera de horario — encolar para las 07:00 del día siguiente
      const executeAt = ConductsefTimeGuard.getNextAllowedTime(timezone);
      await ConductsefTimeGuard.enqueue(jobName, payload, executeAt, tenantId);

      console.log(
        `[CONDUSEF-GUARD] ⏳ Job ${jobName} encolado para ${executeAt.toISOString()}. ` +
        `Hora actual: ${hour}:xx — fuera del horario permitido (07:00–21:59).`
      );

      return {
        allowed:    false,
        currentHour: hour,
        timezone,
        reason:    `Fuera del horario CONDUSEF (07:00–21:59). Hora actual: ${hour}:xx.`,
        queuedAt:  now.toISOString(),
        executeAt: executeAt.toISOString(),
      };
    }

    // ── 3. En horario permitido — ejecutar inmediatamente ─────────────────
    try {
      await fn();
      return {
        allowed:     true,
        currentHour: hour,
        timezone,
      };
    } catch (error) {
      console.error(`[CONDUSEF-GUARD] Error ejecutando ${jobName}:`, error);
      throw error;
    }
  }

  // ─── Cola de Redis (simplificada via DB si Redis no está disponible) ──────

  /**
   * Encola un job para ejecución futura.
   * Usa WhatsAppMessage con scheduledFor como mecanismo de cola,
   * compatible con el sistema existente de processScheduledMessages.
   */
  private static async enqueue(
    jobName:   string,
    payload:   Record<string, unknown>,
    executeAt: Date,
    tenantId?: string
  ): Promise<void> {
    try {
      // Intentar usar Redis si está disponible
      if (process.env.REDIS_URL) {
        const { createClient } = await import('redis');
        const client = createClient({ url: process.env.REDIS_URL });
        await client.connect();

        const job: QueuedJob = {
          jobName,
          payload,
          queuedAt:  new Date().toISOString(),
          executeAt: executeAt.toISOString(),
          tenantId,
        };

        // Usar Redis sorted set con timestamp como score para ordenamiento
        await client.zAdd('condusef:queue', {
          score:  executeAt.getTime(),
          value:  JSON.stringify(job),
        });

        await client.disconnect();
        return;
      }
    } catch (redisError) {
      console.warn('[CONDUSEF-GUARD] Redis no disponible, usando DB como fallback:', redisError);
    }

    // Fallback: persistir en WhatsAppMessage con scheduledFor
    // Solo funciona para jobs de tipo WhatsApp
    if (payload.clientId && payload.message) {
      await prisma.whatsAppMessage.create({
        data: {
          clientId:    String(payload.clientId),
          phone:       String(payload.phone ?? ''),
          messageType: (payload.messageType as any) ?? 'CUSTOM',
          status:      'PENDING',
          message:     String(payload.message),
          scheduledFor: executeAt,
          metadata:    JSON.stringify({
            condusef_queued: true,
            original_job:    jobName,
            queued_at:       new Date().toISOString(),
          }),
        },
      });
    }
  }

  /**
   * Drena la cola CONDUSEF y ejecuta los jobs cuyo executeAt ya pasó.
   * Llamado por el cronjob diario a las 07:00 hrs.
   */
  static async drainQueue(
    executors: Record<string, (payload: Record<string, unknown>) => Promise<void>>
  ): Promise<number> {
    let processed = 0;

    try {
      if (!process.env.REDIS_URL) return 0;

      const { createClient } = await import('redis');
      const client = createClient({ url: process.env.REDIS_URL });
      await client.connect();

      // Obtener jobs cuyo tiempo de ejecución ya llegó
      const now  = Date.now();
      const jobs = await client.zRangeByScore('condusef:queue', 0, now);

      for (const jobStr of jobs) {
        try {
          const job = JSON.parse(jobStr) as QueuedJob;
          const executor = executors[job.jobName];

          if (executor) {
            await executor(job.payload);
            await client.zRem('condusef:queue', jobStr);
            processed++;
            console.log(`[CONDUSEF-GUARD] ✅ Job ${job.jobName} ejecutado desde cola.`);
          }
        } catch (err) {
          console.error('[CONDUSEF-GUARD] Error procesando job de cola:', err);
        }
      }

      await client.disconnect();
    } catch (err) {
      console.warn('[CONDUSEF-GUARD] Error accediendo a la cola Redis:', err);
    }

    return processed;
  }

  /**
   * Registra en audit_logs los intentos de contacto bloqueados.
   */
  private static async logBlockedContact(
    phone:    string,
    reason:   'PERSONAL_REFERENCE' | 'OUT_OF_HOURS',
    tenantId?: string
  ): Promise<void> {
    try {
      await prisma.auditLog.create({
        data: {
          action:   'SECURITY_BLOCK',
          resource: 'WHATSAPP_CONTACT',
          details:  JSON.stringify({ phone, reason, blocked_at: new Date().toISOString() }),
          tenantId: tenantId ?? null,
          metadata: JSON.stringify({ condusef: true, compliance: 'CONDUSEF_REDECO' }),
        },
      });
    } catch (err) {
      console.error('[CONDUSEF-GUARD] Error registrando bloqueo:', err);
    }
  }
}

export default ConductsefTimeGuard;
