/**
 * Conversation Service - WhatsApp Bidireccional
 * 
 * Este servicio maneja:
 * - Gestión de conversaciones con clientes
 * - Mensajes entrantes y salientes
 * - Chatbot automático
 * - Respuestas automáticas
 */

import { PrismaClient } from '@prisma/client';
// Tipos temporales para evitar errores de compilación si el cliente de Prisma no está sincronizado
type ConversationStatus = any;
type MessageDirection = any;
import { WahaService } from './waha';

const prisma = new PrismaClient();
const wahaService = new WahaService();

export interface IncomingMessage {
    from: string;
    body: string;
    mediaUrl?: string;
    messageType?: 'text' | 'image' | 'document' | 'audio' | 'video' | 'location';
    wahaMessageId?: string;
}

export class ConversationService {
    /**
     * Procesa un mensaje entrante desde WAHA
     */
    async handleIncomingMessage(message: IncomingMessage): Promise<void> {
        console.log(`📨 Mensaje entrante de ${message.from}: ${message.body}`);

        try {
            // 1. Buscar o crear conversación
            const conversation = await this.getOrCreateConversation(message.from);

            // 2. Guardar mensaje entrante
            await prisma.conversationMessage.create({
                data: {
                    conversationId: conversation.id,
                    direction: 'INBOUND',
                    content: message.body,
                    messageType: message.messageType === 'text' ? 'TEXT' :
                        message.messageType === 'image' ? 'IMAGE' :
                            message.messageType === 'document' ? 'DOCUMENT' :
                                message.messageType === 'audio' ? 'AUDIO' :
                                    message.messageType === 'video' ? 'VIDEO' :
                                        message.messageType === 'location' ? 'LOCATION' : 'TEXT',
                    mediaUrl: message.mediaUrl,
                    wahaMessageId: message.wahaMessageId,
                    status: 'DELIVERED',
                    deliveredAt: new Date()
                }
            });

            // 3. Actualizar última actividad de la conversación
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { lastMessageAt: new Date() }
            });

            // 4. Intentar respuesta automática del chatbot
            const autoResponse = await this.processWithChatbot(message.body, conversation.clientId);

            if (autoResponse) {
                await this.sendMessage(conversation.id, autoResponse, null);
            }

        } catch (error) {
            console.error('❌ Error procesando mensaje entrante:', error);
            throw error;
        }
    }

    /**
     * Busca o crea una conversación para un número de teléfono
     */
    private async getOrCreateConversation(phone: string) {
        // Normalizar número de teléfono
        const normalizedPhone = phone.replace(/[^0-9]/g, '');

        // Buscar cliente por teléfono
        const client = await prisma.client.findFirst({
            where: {
                phone: {
                    contains: normalizedPhone.slice(-10) // Últimos 10 dígitos
                }
            }
        });

        if (!client) {
            throw new Error(`Cliente no encontrado para el teléfono ${phone}`);
        }

        // Buscar conversación activa
        let conversation = await prisma.conversation.findFirst({
            where: {
                clientId: client.id,
                status: 'ACTIVE'
            }
        });

        // Si no existe, crear una nueva
        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    clientId: client.id,
                    phone: normalizedPhone,
                    status: 'ACTIVE'
                }
            });
        }

        return conversation;
    }

    /**
     * Procesa un mensaje con el chatbot y devuelve una respuesta si aplica
     */
    private async processWithChatbot(message: string, clientId: string): Promise<string | null> {
        const messageLower = message.toLowerCase().trim();

        // Obtener reglas del chatbot ordenadas por prioridad
        const rules = await prisma.chatbotRule.findMany({
            where: { isActive: true },
            orderBy: { priority: 'desc' }
        });

        for (const rule of rules) {
            let isMatch = false;

            if (rule.triggerType === 'KEYWORD') {
                // Coincidencia por palabra clave
                const keywords = rule.trigger.toLowerCase().split(',').map((k: string) => k.trim());
                isMatch = keywords.some((keyword: string) => messageLower.includes(keyword));
            } else if (rule.triggerType === 'REGEX') {
                // Coincidencia por regex
                try {
                    const regex = new RegExp(rule.trigger, 'i');
                    isMatch = regex.test(message);
                } catch (e) {
                    console.error(`Regex inválido en regla ${rule.id}:`, e);
                }
            }

            if (isMatch) {
                // Validar condiciones adicionales si existen
                if (rule.conditions) {
                    const conditions = JSON.parse(rule.conditions);
                    const meetsConditions = await this.evaluateConditions(conditions, clientId);
                    if (!meetsConditions) {
                        continue;
                    }
                }

                // Ejecutar acciones si existen
                if (rule.actions) {
                    await this.executeActions(JSON.parse(rule.actions), clientId);
                }

                // Personalizar respuesta
                return await this.personalizeResponse(rule.response, clientId);
            }
        }

        return null; // Sin respuesta automática
    }

    /**
     * Evalúa condiciones del chatbot
     */
    private async evaluateConditions(conditions: any, clientId: string): Promise<boolean> {
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: {
                loans: {
                    where: { status: 'ACTIVE' },
                    take: 1
                }
            }
        });

        if (!client) return false;

        // Ejemplo de condiciones
        if (conditions.hasActiveLoans !== undefined) {
            if ((client.loans.length > 0) !== conditions.hasActiveLoans) {
                return false;
            }
        }

        return true;
    }

    /**
     * Ejecuta acciones del chatbot
     */
    private async executeActions(actions: any, clientId: string): Promise<void> {
        // Ejemplo: marcar conversación, asignar a asesor, crear notificación, etc.
        if (actions.assignToAdvisor) {
            // Asignar conversación a un asesor
            const conversation = await prisma.conversation.findFirst({
                where: { clientId, status: 'ACTIVE' }
            });

            if (conversation) {
                // Buscar asesor del cliente
                const client = await prisma.client.findUnique({
                    where: { id: clientId },
                    select: { asesorId: true }
                });

                if (client?.asesorId) {
                    await prisma.conversation.update({
                        where: { id: conversation.id },
                        data: { assignedToId: client.asesorId }
                    });
                }
            }
        }

        if (actions.createNotification) {
            // Crear notificación para el equipo
            // TODO: Implementar según sistema de notificaciones
        }
    }

    /**
     * Personaliza la respuesta con datos del cliente
     */
    private async personalizeResponse(template: string, clientId: string): Promise<string> {
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: {
                loans: {
                    where: { status: 'ACTIVE' },
                    take: 1,
                    include: {
                        amortizationSchedule: {
                            where: { isPaid: false },
                            orderBy: { paymentDate: 'asc' },
                            take: 1
                        }
                    }
                }
            }
        });

        if (!client) return template;

        let response = template;

        // Variables disponibles
        const variables: Record<string, string> = {
            '{nombre}': client.firstName,
            '{apellido}': client.lastName,
            '{nombre_completo}': `${client.firstName} ${client.lastName}`,
        };

        // Si tiene préstamo activo
        if (client.loans[0]) {
            const loan = client.loans[0];
            variables['{saldo}'] = `$${Number(loan.balanceRemaining).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
            variables['{prestamo_numero}'] = loan.loanNumber;

            if (loan.amortizationSchedule[0]) {
                const nextPayment = loan.amortizationSchedule[0];
                variables['{proximo_pago}'] = `$${Number(nextPayment.totalPayment).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
                variables['{fecha_pago}'] = nextPayment.paymentDate.toLocaleDateString('es-MX');
            }
        }

        // Reemplazar variables
        for (const [key, value] of Object.entries(variables)) {
            response = response.replace(new RegExp(key, 'g'), value);
        }

        return response;
    }

    /**
     * Envía un mensaje en una conversación
     */
    async sendMessage(conversationId: string, content: string, userId: string | null): Promise<void> {
        const conversation = await prisma.conversation.findUnique({
            where: { id: conversationId },
            include: { client: true }
        });

        if (!conversation) {
            throw new Error('Conversación no encontrada');
        }

        try {
            // 1. Enviar mensaje por WAHA
            const wahaResponse = await wahaService.sendTextMessage(
                conversation.clientId,
                conversation.phone,
                content,
                'CUSTOM'
            );

            // 2. Guardar mensaje en BD
            await prisma.conversationMessage.create({
                data: {
                    conversationId,
                    direction: 'OUTBOUND',
                    content,
                    messageType: 'TEXT',
                    sentBy: userId,
                    status: 'SENT',
                    wahaMessageId: wahaResponse
                }
            });

            // 3. Actualizar conversación
            await prisma.conversation.update({
                where: { id: conversationId },
                data: { lastMessageAt: new Date() }
            });

            console.log(`✅ Mensaje enviado a ${conversation.client.firstName} ${conversation.client.lastName}`);
        } catch (error) {
            // Guardar mensaje con estado FAILED
            await prisma.conversationMessage.create({
                data: {
                    conversationId,
                    direction: 'OUTBOUND',
                    content,
                    messageType: 'TEXT',
                    sentBy: userId,
                    status: 'FAILED'
                }
            });

            throw error;
        }
    }

    /**
     * Obtiene conversaciones con filtros
     */
    async getConversations(filters: {
        status?: ConversationStatus;
        assignedToId?: string;
        clientId?: string;
        limit?: number;
        offset?: number;
    }) {
        const { status, assignedToId, clientId, limit = 50, offset = 0 } = filters;

        return await prisma.conversation.findMany({
            where: {
                ...(status && { status }),
                ...(assignedToId && { assignedToId }),
                ...(clientId && { clientId })
            },
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        profileImage: true
                    }
                },
                assignedTo: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                messages: {
                    orderBy: { createdAt: 'desc' },
                    take: 1 // Último mensaje
                }
            },
            orderBy: { lastMessageAt: 'desc' },
            take: limit,
            skip: offset
        });
    }

    /**
     * Obtiene mensajes de una conversación
     */
    async getMessages(conversationId: string, limit = 100, offset = 0) {
        return await prisma.conversationMessage.findMany({
            where: { conversationId },
            include: {
                sender: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' },
            take: limit,
            skip: offset
        });
    }

    /**
     * Cierra una conversación
     */
    async closeConversation(conversationId: string): Promise<void> {
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                status: 'RESOLVED',
                updatedAt: new Date()
            }
        });
    }

    /**
     * Asigna una conversación a un usuario
     */
    async assignConversation(conversationId: string, userId: string): Promise<void> {
        await prisma.conversation.update({
            where: { id: conversationId },
            data: {
                assignedToId: userId,
                updatedAt: new Date()
            }
        });
    }
}

export const conversationService = new ConversationService();
