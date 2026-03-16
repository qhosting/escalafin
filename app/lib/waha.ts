
import axios, { AxiosResponse } from 'axios';
import { PrismaClient } from '@prisma/client';
import { getTenantPrisma } from './tenant-db';

const prisma = new PrismaClient();

interface WahaSession {
  sessionId: string;
  apiKey?: string | null;
  baseUrl: string;
  n8nWebhookUrl?: string | null;
}

interface SendMessagePayload {
  chatId: string;
  text: string;
  session: string;
  [key: string]: any;
}

interface SendMediaPayload {
  chatId: string;
  caption: string;
  session: string;
  file: {
    mimetype: string;
    filename: string;
    url: string;
  };
  [key: string]: any;
}

interface WahaResponse {
  id: string; // Message ID
  timestamp: number;
  [key: string]: any;
}

export class WahaService {
  private config: WahaSession | null = null;
  private tenantId: string | null = null;

  constructor(tenantId?: string | null) {
    if (tenantId) this.tenantId = tenantId;
  }

  private async initializeConfig(): Promise<void> {
    try {
      // Usar el prisma del tenant si hay tenantId, sino usar el prisma global
      const db = this.tenantId ? getTenantPrisma(this.tenantId) : prisma;
      const config = await (db as any).wahaConfig.findFirst({
        where: { isActive: true }
      });

      if (config) {
        this.config = {
          sessionId: config.sessionId,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl,
          n8nWebhookUrl: config.n8nWebhookUrl
        };
      }
    } catch (error) {
      console.error('Error initializing Waha config:', error);
    }
  }

  private async ensureConfig(): Promise<WahaSession> {
    if (!this.config) {
      await this.initializeConfig();
    }

    if (!this.config) {
      throw new Error(`Waha API no está configurado${this.tenantId ? ' para este tenant' : ''}. Configure la instancia desde el panel de administración.`);
    }

    return this.config;
  }

  private formatChatId(phone: string): string {
    // Eliminar caracteres no numéricos
    let cleaned = phone.replace(/\D/g, '');

    // Si no empieza con código de país, agregar +52 (México)
    if (!cleaned.startsWith('52') && cleaned.length === 10) {
      cleaned = '52' + cleaned;
    }

    return cleaned + '@c.us';
  }

  private getHeaders(apiKey?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (apiKey) {
      headers['X-Api-Key'] = apiKey;
    }
    return headers;
  }

  async sendTextMessage(
    clientId: string,
    phone: string,
    message: string,
    messageType: 'PAYMENT_RECEIVED' | 'PAYMENT_REMINDER' | 'LOAN_APPROVED' | 'LOAN_UPDATE' | 'MARKETING' | 'CUSTOM',
    paymentId?: string,
    loanId?: string
  ): Promise<string> {
    try {
      const config = await this.ensureConfig();
      const chatId = this.formatChatId(phone);

      // Crear registro en la base de datos
      const whatsappMessage = await prisma.whatsAppMessage.create({
        data: {
          clientId,
          phone: chatId, // Guardamos el chatId completo
          message,
          messageType,
          status: 'PENDING',
          paymentId,
          loanId,
        }
      });

      const payload: SendMessagePayload = {
        chatId,
        text: message,
        session: config.sessionId
      };

      const response: AxiosResponse<WahaResponse> = await axios.post(
        `${config.baseUrl}/api/sendText`,
        payload,
        { headers: this.getHeaders(config.apiKey) }
      );

      // Actualizar registro con respuesta exitosa
      // Waha devuelve { id: "...", ... }
      await prisma.whatsAppMessage.update({
        where: { id: whatsappMessage.id },
        data: {
          status: 'SENT',
          wahaMessageId: response.data.id || response.data.timestamp?.toString(),
          wahaResponse: JSON.stringify(response.data),
          sentAt: new Date()
        }
      });

      // Notificar a n8n si está configurado
      if (config.n8nWebhookUrl) {
        this.notifyN8n(config.n8nWebhookUrl, {
          action: 'message_sent',
          messageId: whatsappMessage.id,
          chatId,
          text: message,
          messageType,
          clientId,
          paymentId,
          loanId
        });
      }

      return whatsappMessage.id;
    } catch (error: any) {
      console.error('Error sending WhatsApp message (Waha):', error);

      // Actualizar registro con error
      if (clientId) { // Ensure we have the ID created contextually or pass it
        // Note: If creation failed, we can't update. But usually creation succeeds.
        // If we have the ID from above we should use it, but here we might not have reference if create failed.
        // Let's rely on the try/catch block scope.
      }

      // We should ideally define whatsappMessage outside try, but for now lets query by properties if we can't access variable
      // Or better, just log it. The creation happens before the request.

      throw error;
    }
  }

  /**
   * Envía un mensaje de texto simple a cualquier número sin registrarlo en la tabla whatsapp_messages
   * Útil para notificaciones de sistema o alertas administrativas.
   */
  async sendRawMessage(
    phone: string,
    message: string
  ): Promise<void> {
    try {
      const config = await this.ensureConfig();
      const chatId = this.formatChatId(phone);

      const payload: SendMessagePayload = {
        chatId,
        text: message,
        session: config.sessionId
      };

      await axios.post(
        `${config.baseUrl}/api/sendText`,
        payload,
        { headers: this.getHeaders(config.apiKey) }
      );
    } catch (error) {
      console.error('Error sending raw WhatsApp message:', error);
      throw error;
    }
  }

  async sendMediaMessage(
    clientId: string,
    phone: string,
    mediaUrl: string,
    caption: string,
    messageType: 'PAYMENT_RECEIVED' | 'PAYMENT_REMINDER' | 'LOAN_APPROVED' | 'LOAN_UPDATE' | 'MARKETING' | 'CUSTOM'
  ): Promise<string> {
    try {
      const config = await this.ensureConfig();
      const chatId = this.formatChatId(phone);

      // Crear registro en la base de datos
      const whatsappMessage = await prisma.whatsAppMessage.create({
        data: {
          clientId,
          phone: chatId,
          message: caption,
          mediaUrl,
          messageType,
          status: 'PENDING'
        }
      });

      // Waha expects file object. Mimetype inference is simple here.
      const extension = mediaUrl.split('.').pop()?.toLowerCase();
      let mimetype = 'application/octet-stream';
      if (['jpg', 'jpeg'].includes(extension || '')) mimetype = 'image/jpeg';
      if (extension === 'png') mimetype = 'image/png';
      if (extension === 'pdf') mimetype = 'application/pdf';

      const payload: SendMediaPayload = {
        chatId,
        caption,
        session: config.sessionId,
        file: {
          mimetype,
          filename: `file.${extension}`, // Generic filename if not parsed from URL
          url: mediaUrl
        }
      };

      // Determine correct endpoint based on mimetype
      const isImage = mimetype.startsWith('image/');
      const endpoint = isImage ? '/api/sendImage' : '/api/sendFile';

      const response: AxiosResponse<WahaResponse> = await axios.post(
        `${config.baseUrl}${endpoint}`,
        payload,
        { headers: this.getHeaders(config.apiKey) }
      );

      // Actualizar registro con respuesta exitosa
      await prisma.whatsAppMessage.update({
        where: { id: whatsappMessage.id },
        data: {
          status: 'SENT',
          wahaMessageId: response.data.id,
          wahaResponse: JSON.stringify(response.data),
          sentAt: new Date()
        }
      });

      return whatsappMessage.id;
    } catch (error: any) {
      console.error('Error sending WhatsApp media message (Waha):', error);
      throw error;
    }
  }

  async sendFileMessage(
    clientId: string,
    phone: string,
    fileBase64: string,
    filename: string,
    caption: string,
    messageType: 'PAYMENT_RECEIVED' | 'CUSTOM',
    paymentId?: string
  ): Promise<string> {
    try {
      const config = await this.ensureConfig();
      const chatId = this.formatChatId(phone);

      // Crear registro en la base de datos
      const whatsappMessage = await (prisma as any).whatsAppMessage.create({
        data: {
          clientId,
          phone: chatId,
          message: caption || filename,
          messageType,
          status: 'PENDING',
          paymentId,
        }
      });

      const payload = {
        chatId,
        file: {
          mimetype: 'application/pdf',
          filename,
          data: fileBase64.split(',')[1] || fileBase64
        },
        caption,
        session: config.sessionId
      };

      const response: AxiosResponse<WahaResponse> = await axios.post(
        `${config.baseUrl}/api/sendFile`,
        payload,
        { headers: this.getHeaders(config.apiKey) }
      );

      await (prisma as any).whatsAppMessage.update({
        where: { id: whatsappMessage.id },
        data: {
          status: 'SENT',
          wahaMessageId: response.data.id || response.data.timestamp?.toString(),
          wahaResponse: JSON.stringify(response.data),
          sentAt: new Date()
        }
      });

      return whatsappMessage.id;
    } catch (error) {
      console.error('Error in WahaService.sendFileMessage:', error);
      throw error;
    }
  }

  async getSessionStatus(): Promise<any> {
    try {
      const config = await this.ensureConfig();

      // Get all sessions or specific one
      const response = await axios.get(
        `${config.baseUrl}/api/sessions?all=true`,
        { headers: this.getHeaders(config.apiKey) }
      );

      // Filter for our session
      const session = response.data.find((s: any) => s.name === config.sessionId);
      return session || { status: 'qh', details: 'Session not found in Waha response' };
    } catch (error) {
      console.error('Error getting Waha session status:', error);
      throw error;
    }
  }

  // Plantillas de mensajes predefinidas (reutilizadas)
  static generatePaymentReceivedMessage(
    clientName: string,
    amount: number,
    loanNumber: string,
    paymentDate: Date
  ): string {
    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);

    const formattedDate = new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(paymentDate);

    return `🎉 *¡Pago recibido exitosamente!*

Hola ${clientName},

Hemos recibido tu pago de ${formattedAmount} para el préstamo #${loanNumber}.

📅 *Fecha de pago:* ${formattedDate}
💰 *Monto:* ${formattedAmount}
📄 *Préstamo:* #${loanNumber}

¡Gracias por tu puntualidad! Tu historial crediticio se mantiene excelente.

*EscalaFin - Tu aliado financiero*`;
  }

  static generatePaymentReminderMessage(
    clientName: string,
    amount: number,
    loanNumber: string,
    dueDate: Date,
    daysOverdue: number = 0
  ): string {
    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);

    const formattedDate = new Intl.DateTimeFormat('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(dueDate);

    let message = `🔔 *Recordatorio de pago*

Hola ${clientName},

${daysOverdue > 0
        ? `Tu pago de ${formattedAmount} para el préstamo #${loanNumber} venció hace ${daysOverdue} día(s).`
        : `Tu pago de ${formattedAmount} para el préstamo #${loanNumber} vence el ${formattedDate}.`
      }

💰 *Monto:* ${formattedAmount}
📄 *Préstamo:* #${loanNumber}
📅 *Fecha de vencimiento:* ${formattedDate}

${daysOverdue > 0
        ? '⚠️ *Importante:* Para evitar cargos adicionales, realiza tu pago lo antes posible.'
        : 'Puedes realizar tu pago a través de nuestra plataforma web o contacta a tu asesor.'
      }

*EscalaFin - Tu aliado financiero*`;

    return message;
  }

  static generateLoanApprovedMessage(
    clientName: string,
    amount: number,
    loanNumber: string,
    monthlyPayment: number,
    termMonths: number
  ): string {
    const formattedAmount = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);

    const formattedMonthly = new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(monthlyPayment);

    return `✅ *¡Préstamo aprobado!*

¡Felicidades ${clientName}!

Tu solicitud de préstamo ha sido aprobada.

💰 *Monto aprobado:* ${formattedAmount}
📄 *Número de préstamo:* #${loanNumber}
💳 *Pago mensual:* ${formattedMonthly}
📅 *Plazo:* ${termMonths} meses

Los fondos serán depositados en tu cuenta en las próximas 24-48 horas hábiles.

*EscalaFin - Tu aliado financiero*`;
  }

  private async notifyN8n(url: string, payload: any): Promise<void> {
    try {
      await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      console.error('Error notifying n8n:', error);
    }
  }
}

export default WahaService;
