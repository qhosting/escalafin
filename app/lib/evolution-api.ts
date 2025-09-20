
import axios, { AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface EvolutionAPIInstance {
  instanceName: string;
  apiKey: string;
  baseUrl: string;
}

interface SendMessagePayload {
  number: string;
  text: string;
  mediaUrl?: string;
  delay?: number;
}

interface WhatsAppResponse {
  key: {
    id: string;
    remoteJid: string;
    fromMe: boolean;
  };
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
  status: string;
}

export class EvolutionAPIService {
  private config: EvolutionAPIInstance | null = null;

  constructor() {
    this.initializeConfig();
  }

  private async initializeConfig(): Promise<void> {
    try {
      const config = await prisma.evolutionAPIConfig.findFirst({
        where: { isActive: true }
      });

      if (config) {
        this.config = {
          instanceName: config.instanceName,
          apiKey: config.apiKey,
          baseUrl: config.baseUrl
        };
      }
    } catch (error) {
      console.error('Error initializing EvolutionAPI config:', error);
    }
  }

  private async ensureConfig(): Promise<EvolutionAPIInstance> {
    if (!this.config) {
      await this.initializeConfig();
    }
    
    if (!this.config) {
      throw new Error('EvolutionAPI no está configurado. Configure la instancia desde el panel de administración.');
    }

    return this.config;
  }

  private formatPhoneNumber(phone: string): string {
    // Eliminar caracteres no numéricos
    let cleaned = phone.replace(/\D/g, '');
    
    // Si no empieza con código de país, agregar +52 (México)
    if (!cleaned.startsWith('52') && cleaned.length === 10) {
      cleaned = '52' + cleaned;
    }
    
    return cleaned + '@s.whatsapp.net';
  }

  private getHeaders(apiKey: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'apikey': apiKey
    };
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
      const formattedPhone = this.formatPhoneNumber(phone);

      // Crear registro en la base de datos
      const whatsappMessage = await prisma.whatsAppMessage.create({
        data: {
          clientId,
          phone: formattedPhone,
          message,
          messageType,
          status: 'PENDING',
          paymentId,
          loanId,
        }
      });

      const payload: SendMessagePayload = {
        number: formattedPhone,
        text: message,
        delay: 1000
      };

      const response: AxiosResponse<WhatsAppResponse> = await axios.post(
        `${config.baseUrl}/message/sendText/${config.instanceName}`,
        payload,
        { headers: this.getHeaders(config.apiKey) }
      );

      // Actualizar registro con respuesta exitosa
      await prisma.whatsAppMessage.update({
        where: { id: whatsappMessage.id },
        data: {
          status: 'SENT',
          evolutionMessageId: response.data.key.id,
          evolutionResponse: JSON.stringify(response.data),
          sentAt: new Date()
        }
      });

      return whatsappMessage.id;
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      
      // Actualizar registro con error
      if (error.response?.data) {
        await prisma.whatsAppMessage.updateMany({
          where: {
            clientId,
            status: 'PENDING',
            message
          },
          data: {
            status: 'FAILED',
            errorMessage: error.response.data.message || error.message,
            evolutionResponse: JSON.stringify(error.response.data)
          }
        });
      }

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
      const formattedPhone = this.formatPhoneNumber(phone);

      // Crear registro en la base de datos
      const whatsappMessage = await prisma.whatsAppMessage.create({
        data: {
          clientId,
          phone: formattedPhone,
          message: caption,
          mediaUrl,
          messageType,
          status: 'PENDING'
        }
      });

      const payload = {
        number: formattedPhone,
        mediaUrl,
        caption,
        delay: 1000
      };

      const response: AxiosResponse<WhatsAppResponse> = await axios.post(
        `${config.baseUrl}/message/sendMedia/${config.instanceName}`,
        payload,
        { headers: this.getHeaders(config.apiKey) }
      );

      // Actualizar registro con respuesta exitosa
      await prisma.whatsAppMessage.update({
        where: { id: whatsappMessage.id },
        data: {
          status: 'SENT',
          evolutionMessageId: response.data.key.id,
          evolutionResponse: JSON.stringify(response.data),
          sentAt: new Date()
        }
      });

      return whatsappMessage.id;
    } catch (error: any) {
      console.error('Error sending WhatsApp media message:', error);
      throw error;
    }
  }

  async getInstanceStatus(): Promise<any> {
    try {
      const config = await this.ensureConfig();
      
      const response = await axios.get(
        `${config.baseUrl}/instance/fetchInstances`,
        { headers: this.getHeaders(config.apiKey) }
      );

      return response.data;
    } catch (error) {
      console.error('Error getting instance status:', error);
      throw error;
    }
  }

  // Plantillas de mensajes predefinidas
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
}

export default EvolutionAPIService;
