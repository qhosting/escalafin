/**
 * Servicio de Webhooks
 * Gestiona endpoints de webhook y dispatch de eventos a integraciones externas
 */

import { prisma } from '@/lib/prisma';
import crypto from 'crypto';
import type { WebhookEndpoint, WebhookDelivery } from '@prisma/client';

// ============================================
// TIPOS
// ============================================

export interface CreateWebhookInput {
    tenantId: string;
    url: string;
    description?: string;
    events: string[];
}

export interface WebhookPayload {
    id: string;
    event: string;
    timestamp: string;
    tenant: {
        id: string;
        slug: string;
    };
    data: Record<string, any>;
}

export interface DeliveryResult {
    success: boolean;
    statusCode?: number;
    error?: string;
    duration: number;
}

// ============================================
// EVENTOS DISPONIBLES
// ============================================

export const WEBHOOK_EVENTS = {
    // Clientes
    'client.created': 'Nuevo cliente creado',
    'client.updated': 'Cliente actualizado',
    'client.deleted': 'Cliente eliminado',

    // Préstamos
    'loan.created': 'Préstamo creado',
    'loan.approved': 'Préstamo aprobado',
    'loan.disbursed': 'Préstamo desembolsado',
    'loan.paid_off': 'Préstamo liquidado',
    'loan.defaulted': 'Préstamo en mora',

    // Pagos
    'payment.created': 'Pago registrado',
    'payment.completed': 'Pago completado',
    'payment.failed': 'Pago fallido',

    // Solicitudes de crédito
    'application.submitted': 'Solicitud enviada',
    'application.approved': 'Solicitud aprobada',
    'application.rejected': 'Solicitud rechazada',

    // Billing (interno)
    'subscription.created': 'Suscripción creada',
    'subscription.updated': 'Suscripción actualizada',
    'subscription.canceled': 'Suscripción cancelada',
    'invoice.created': 'Factura generada',
    'invoice.paid': 'Factura pagada'
} as const;

export type WebhookEvent = keyof typeof WEBHOOK_EVENTS;

// ============================================
// CONSTANTES
// ============================================

const MAX_RETRIES = 3;
const RETRY_DELAYS = [60, 300, 900]; // 1min, 5min, 15min
const TIMEOUT_MS = 10000; // 10 segundos
const MAX_FAILURES_BEFORE_DISABLE = 10;

// ============================================
// SERVICIO DE WEBHOOKS
// ============================================

export class WebhooksService {

    /**
     * Crea un nuevo endpoint de webhook
     */
    static async createEndpoint(input: CreateWebhookInput): Promise<WebhookEndpoint> {
        const { tenantId, url, description, events } = input;

        // Generar secret para firmar payloads
        const secret = crypto.randomBytes(32).toString('hex');

        return prisma.webhookEndpoint.create({
            data: {
                tenantId,
                url,
                description,
                events: JSON.stringify(events),
                secret,
                isActive: true
            }
        });
    }

    /**
     * Lista endpoints de un tenant
     */
    static async listEndpoints(tenantId: string): Promise<WebhookEndpoint[]> {
        return prisma.webhookEndpoint.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' }
        });
    }

    /**
     * Obtiene un endpoint específico
     */
    static async getEndpoint(tenantId: string, endpointId: string): Promise<WebhookEndpoint | null> {
        return prisma.webhookEndpoint.findFirst({
            where: { id: endpointId, tenantId }
        });
    }

    /**
     * Actualiza un endpoint
     */
    static async updateEndpoint(
        tenantId: string,
        endpointId: string,
        data: Partial<Pick<CreateWebhookInput, 'url' | 'description' | 'events'>>
    ): Promise<WebhookEndpoint | null> {
        const updated = await prisma.webhookEndpoint.updateMany({
            where: { id: endpointId, tenantId },
            data: {
                ...data,
                events: data.events ? JSON.stringify(data.events) : undefined
            }
        });

        if (updated.count === 0) return null;

        return prisma.webhookEndpoint.findUnique({ where: { id: endpointId } });
    }

    /**
     * Elimina un endpoint
     */
    static async deleteEndpoint(tenantId: string, endpointId: string): Promise<boolean> {
        const result = await prisma.webhookEndpoint.deleteMany({
            where: { id: endpointId, tenantId }
        });
        return result.count > 0;
    }

    /**
     * Activa/desactiva un endpoint
     */
    static async toggleEndpoint(tenantId: string, endpointId: string, isActive: boolean): Promise<void> {
        await prisma.webhookEndpoint.updateMany({
            where: { id: endpointId, tenantId },
            data: { isActive, failureCount: isActive ? 0 : undefined }
        });
    }

    /**
     * Regenera el secret de un endpoint
     */
    static async regenerateSecret(tenantId: string, endpointId: string): Promise<string | null> {
        const newSecret = crypto.randomBytes(32).toString('hex');

        const result = await prisma.webhookEndpoint.updateMany({
            where: { id: endpointId, tenantId },
            data: { secret: newSecret }
        });

        return result.count > 0 ? newSecret : null;
    }

    /**
     * Dispara un evento a todos los endpoints suscritos de un tenant
     */
    static async dispatch(
        tenantId: string,
        event: WebhookEvent,
        data: Record<string, any>
    ): Promise<void> {
        // Buscar tenant
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { id: true, slug: true }
        });

        if (!tenant) return;

        // Buscar endpoints activos suscritos a este evento
        const endpoints = await prisma.webhookEndpoint.findMany({
            where: {
                tenantId,
                isActive: true
            }
        });

        // Filtrar por evento
        const subscribedEndpoints = endpoints.filter(ep => {
            const events = JSON.parse(ep.events) as string[];
            return events.includes(event) || events.includes('*');
        });

        // Crear payload
        const payload: WebhookPayload = {
            id: crypto.randomUUID(),
            event,
            timestamp: new Date().toISOString(),
            tenant: { id: tenant.id, slug: tenant.slug },
            data
        };

        // Enviar a cada endpoint (en paralelo)
        const deliveryPromises = subscribedEndpoints.map(endpoint =>
            this.deliverToEndpoint(endpoint, payload)
        );

        // No esperamos los resultados para no bloquear
        Promise.allSettled(deliveryPromises).catch(console.error);
    }

    /**
     * Entrega el payload a un endpoint específico
     */
    private static async deliverToEndpoint(
        endpoint: WebhookEndpoint,
        payload: WebhookPayload
    ): Promise<void> {
        const payloadString = JSON.stringify(payload);
        const signature = this.signPayload(payloadString, endpoint.secret);

        const startTime = Date.now();
        let result: DeliveryResult;

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

            const response = await fetch(endpoint.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': payload.event,
                    'X-Webhook-Delivery': payload.id,
                    'User-Agent': 'EscalaFin-Webhook/1.0'
                },
                body: payloadString,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            result = {
                success: response.ok,
                statusCode: response.status,
                duration: Date.now() - startTime
            };

            if (!response.ok) {
                result.error = `HTTP ${response.status}: ${response.statusText}`;
            }

        } catch (error) {
            result = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            };
        }

        // Registrar delivery
        await this.recordDelivery(endpoint.id, payload, result);

        // Actualizar estado del endpoint
        await this.updateEndpointStatus(endpoint.id, result);
    }

    /**
     * Firma un payload con HMAC-SHA256
     */
    static signPayload(payload: string, secret: string): string {
        const hmac = crypto.createHmac('sha256', secret);
        hmac.update(payload);
        return `sha256=${hmac.digest('hex')}`;
    }

    /**
     * Verifica la firma de un payload (para uso en endpoints que reciben webhooks)
     */
    static verifySignature(payload: string, signature: string, secret: string): boolean {
        const expected = this.signPayload(payload, secret);
        return crypto.timingSafeEqual(
            Buffer.from(signature),
            Buffer.from(expected)
        );
    }

    /**
     * Registra un intento de delivery
     */
    private static async recordDelivery(
        endpointId: string,
        payload: WebhookPayload,
        result: DeliveryResult
    ): Promise<WebhookDelivery> {
        return prisma.webhookDelivery.create({
            data: {
                endpointId,
                event: payload.event,
                payload: JSON.stringify(payload),
                statusCode: result.statusCode,
                response: result.error ? null : 'OK',
                error: result.error,
                attempts: 1,
                deliveredAt: result.success ? new Date() : null,
                nextRetryAt: result.success ? null : this.calculateNextRetry(1)
            }
        });
    }

    /**
     * Actualiza el estado del endpoint basado en el resultado
     */
    private static async updateEndpointStatus(
        endpointId: string,
        result: DeliveryResult
    ): Promise<void> {
        if (result.success) {
            // Resetear contador de fallos
            await prisma.webhookEndpoint.update({
                where: { id: endpointId },
                data: {
                    failureCount: 0,
                    lastTriggeredAt: new Date(),
                    lastStatusCode: result.statusCode,
                    lastError: null
                }
            });
        } else {
            // Incrementar contador de fallos
            const endpoint = await prisma.webhookEndpoint.update({
                where: { id: endpointId },
                data: {
                    failureCount: { increment: 1 },
                    lastTriggeredAt: new Date(),
                    lastStatusCode: result.statusCode,
                    lastError: result.error
                }
            });

            // Desactivar si hay muchos fallos
            if (endpoint.failureCount >= MAX_FAILURES_BEFORE_DISABLE) {
                await prisma.webhookEndpoint.update({
                    where: { id: endpointId },
                    data: { isActive: false }
                });
                console.warn(`Webhook endpoint ${endpointId} disabled due to ${endpoint.failureCount} failures`);
            }
        }
    }

    /**
     * Calcula el próximo retry con backoff exponencial
     */
    private static calculateNextRetry(attempt: number): Date | null {
        if (attempt >= MAX_RETRIES) return null;

        const delaySeconds = RETRY_DELAYS[attempt - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
        const nextRetry = new Date();
        nextRetry.setSeconds(nextRetry.getSeconds() + delaySeconds);
        return nextRetry;
    }

    /**
     * Procesa reintentos pendientes (llamar desde cron job)
     */
    static async processRetries(): Promise<number> {
        const pendingRetries = await prisma.webhookDelivery.findMany({
            where: {
                deliveredAt: null,
                nextRetryAt: { lte: new Date() },
                attempts: { lt: MAX_RETRIES }
            },
            include: { endpoint: true }
        });

        let processed = 0;
        for (const delivery of pendingRetries) {
            if (!delivery.endpoint.isActive) continue;

            const payload = JSON.parse(delivery.payload) as WebhookPayload;
            const payloadString = JSON.stringify(payload);
            const signature = this.signPayload(payloadString, delivery.endpoint.secret);

            try {
                const response = await fetch(delivery.endpoint.url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Webhook-Signature': signature,
                        'X-Webhook-Event': payload.event,
                        'X-Webhook-Delivery': payload.id,
                        'X-Webhook-Retry': String(delivery.attempts + 1),
                        'User-Agent': 'EscalaFin-Webhook/1.0'
                    },
                    body: payloadString
                });

                if (response.ok) {
                    await prisma.webhookDelivery.update({
                        where: { id: delivery.id },
                        data: {
                            deliveredAt: new Date(),
                            statusCode: response.status,
                            nextRetryAt: null
                        }
                    });
                } else {
                    throw new Error(`HTTP ${response.status}`);
                }
            } catch (error) {
                await prisma.webhookDelivery.update({
                    where: { id: delivery.id },
                    data: {
                        attempts: { increment: 1 },
                        error: error instanceof Error ? error.message : 'Unknown error',
                        nextRetryAt: this.calculateNextRetry(delivery.attempts + 1)
                    }
                });
            }

            processed++;
        }

        return processed;
    }

    /**
     * Obtiene historial de deliveries de un endpoint
     */
    static async getDeliveryHistory(
        tenantId: string,
        endpointId: string,
        limit: number = 50
    ): Promise<WebhookDelivery[]> {
        // Verificar que el endpoint pertenece al tenant
        const endpoint = await prisma.webhookEndpoint.findFirst({
            where: { id: endpointId, tenantId }
        });

        if (!endpoint) return [];

        return prisma.webhookDelivery.findMany({
            where: { endpointId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });
    }

    /**
     * Prueba un endpoint enviando un evento de test
     */
    static async testEndpoint(tenantId: string, endpointId: string): Promise<DeliveryResult> {
        const endpoint = await this.getEndpoint(tenantId, endpointId);
        if (!endpoint) {
            return { success: false, error: 'Endpoint not found', duration: 0 };
        }

        const testPayload: WebhookPayload = {
            id: crypto.randomUUID(),
            event: 'test.ping',
            timestamp: new Date().toISOString(),
            tenant: { id: tenantId, slug: 'test' },
            data: { message: 'This is a test webhook from EscalaFin' }
        };

        const payloadString = JSON.stringify(testPayload);
        const signature = this.signPayload(payloadString, endpoint.secret);

        const startTime = Date.now();

        try {
            const response = await fetch(endpoint.url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Signature': signature,
                    'X-Webhook-Event': 'test.ping',
                    'X-Webhook-Delivery': testPayload.id,
                    'User-Agent': 'EscalaFin-Webhook/1.0'
                },
                body: payloadString
            });

            return {
                success: response.ok,
                statusCode: response.status,
                error: response.ok ? undefined : `HTTP ${response.status}`,
                duration: Date.now() - startTime
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                duration: Date.now() - startTime
            };
        }
    }
}

export default WebhooksService;
