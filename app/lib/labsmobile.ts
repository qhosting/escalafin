
/**
 * LabsMobile SMS Service
 * Servicio para envío de SMS a través de LabsMobile API
 * Límite: 160 caracteres por mensaje
 */

interface LabsMobileConfig {
  username: string;
  apiToken: string;
  sender?: string; // Remitente del mensaje (hasta 11 caracteres)
}

interface SMSMessage {
  recipient: string; // Número de teléfono
  message: string; // Máximo 160 caracteres
  sender?: string;
}

interface SMSResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  remainingCredits?: number;
}

export class LabsMobileService {
  private config: LabsMobileConfig;
  private baseUrl = 'https://api.labsmobile.com/json/send';

  constructor(config?: LabsMobileConfig) {
    this.config = config || {
      username: process.env.LABSMOBILE_USERNAME || '',
      apiToken: process.env.LABSMOBILE_API_TOKEN || '',
      sender: process.env.LABSMOBILE_SENDER || 'EscalaFin'
    };
  }

  /**
   * Validar configuración de LabsMobile
   */
  isConfigured(): boolean {
    return !!(this.config.username && this.config.apiToken);
  }

  /**
   * Truncar mensaje a 160 caracteres
   */
  private truncateMessage(message: string): string {
    if (message.length <= 160) return message;
    return message.substring(0, 157) + '...';
  }

  /**
   * Formatear número de teléfono para LabsMobile
   * Formato esperado: +52XXXXXXXXXX
   */
  private formatPhoneNumber(phone: string): string {
    // Remover espacios, guiones y paréntesis
    let cleaned = phone.replace(/[\s\-\(\)]/g, '');
    
    // Si no empieza con +, agregar +52 (México)
    if (!cleaned.startsWith('+')) {
      if (cleaned.startsWith('52')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+52' + cleaned;
      }
    }
    
    return cleaned;
  }

  /**
   * Enviar SMS individual
   */
  async sendSMS(smsData: SMSMessage): Promise<SMSResponse> {
    try {
      if (!this.isConfigured()) {
        throw new Error('LabsMobile no está configurado correctamente');
      }

      const truncatedMessage = this.truncateMessage(smsData.message);
      const formattedPhone = this.formatPhoneNumber(smsData.recipient);

      const payload = {
        username: this.config.username,
        password: this.config.apiToken,
        sender: smsData.sender || this.config.sender,
        message: truncatedMessage,
        recipient: [{
          msisdn: formattedPhone
        }]
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok || data.code !== '0') {
        throw new Error(data.message || 'Error al enviar SMS');
      }

      return {
        success: true,
        messageId: data.subid || undefined,
        remainingCredits: data.credits || undefined
      };

    } catch (error) {
      console.error('Error enviando SMS:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
      };
    }
  }

  /**
   * Enviar SMS masivo
   */
  async sendBulkSMS(messages: SMSMessage[]): Promise<SMSResponse[]> {
    const results: SMSResponse[] = [];

    for (const message of messages) {
      const result = await this.sendSMS(message);
      results.push(result);
      
      // Pequeña pausa entre mensajes para evitar rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Consultar créditos disponibles
   */
  async getCredits(): Promise<number> {
    try {
      if (!this.isConfigured()) {
        throw new Error('LabsMobile no está configurado');
      }

      const response = await fetch('https://api.labsmobile.com/json/balance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: this.config.username,
          password: this.config.apiToken
        })
      });

      const data = await response.json();

      if (!response.ok || data.code !== '0') {
        throw new Error(data.message || 'Error al consultar créditos');
      }

      return parseFloat(data.credits || '0');

    } catch (error) {
      console.error('Error consultando créditos:', error);
      return 0;
    }
  }

  /**
   * Generar mensajes predefinidos (máximo 160 caracteres)
   */
  static generatePaymentReceivedSMS(clientName: string, amount: number, loanNumber: string): string {
    const msg = `${clientName}, recibimos tu pago de $${amount.toFixed(2)} del préstamo ${loanNumber}. ¡Gracias!`;
    return msg.substring(0, 160);
  }

  static generatePaymentReminderSMS(clientName: string, amount: number, dueDate: Date): string {
    const date = dueDate.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
    const msg = `${clientName}, recordatorio: pago de $${amount.toFixed(2)} vence el ${date}. Evita recargos.`;
    return msg.substring(0, 160);
  }

  static generateOverduePaymentSMS(clientName: string, daysOverdue: number, amount: number): string {
    const msg = `${clientName}, tu pago de $${amount.toFixed(2)} tiene ${daysOverdue} días de atraso. Comunícate con nosotros.`;
    return msg.substring(0, 160);
  }

  static generateLoanApprovedSMS(clientName: string, amount: number): string {
    const msg = `¡Felicidades ${clientName}! Tu préstamo de $${amount.toFixed(2)} fue aprobado. Pronto te contactaremos.`;
    return msg.substring(0, 160);
  }
}

export default LabsMobileService;
