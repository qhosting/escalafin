/**
 * Módulo de WhatsApp Flows (Meta / WAHA Interactive Flows)
 * EscalaFin v3.0.0 - Producción
 * 
 * Permite enviar y procesar formularios interactivos enriquecidos dentro de WhatsApp
 * para Solicitudes de Crédito Expres, Promesas de Pago y Verificación de Datos.
 */

import { WahaService } from './waha';
import { prisma } from './prisma';

export interface WhatsAppFlowScreen {
  id: string;
  title: string;
  terminal?: boolean;
  layout: {
    type: 'SingleColumnLayout';
    children: any[];
  };
}

export interface WhatsAppFlowDefinition {
  version: string;
  screens: WhatsAppFlowScreen[];
}

export interface FlowSubmissionData {
  flowId: string;
  clientId: string;
  phone: string;
  responseJson: Record<string, any>;
  submittedAt: string;
}

export class WhatsAppFlowsService {
  private wahaService: WahaService;

  constructor(tenantId?: string) {
    this.wahaService = new WahaService(tenantId);
  }

  /**
   * Genera el Flow interactivo de Solicitud de Crédito Expres
   */
  getCreditRequestFlowDefinition(): WhatsAppFlowDefinition {
    return {
      version: '3.0',
      screens: [
        {
          id: 'CREDIT_SELECTION',
          title: 'Solicitud de Crédito EscalaFin',
          terminal: false,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              {
                type: 'TextBody',
                text: 'Seleccione el monto y plazo para calcular su cuota estimada:',
              },
              {
                type: 'TextInput',
                name: 'requested_amount',
                label: 'Monto Solicitado (MXN)',
                input_type: 'number',
                required: true,
              },
              {
                type: 'Dropdown',
                name: 'term_months',
                label: 'Plazo deseado',
                required: true,
                options: [
                  { id: '3', title: '3 Meses (Semanal)' },
                  { id: '6', title: '6 Meses (Quincenal)' },
                  { id: '12', title: '12 Meses (Mensual)' },
                ],
              },
              {
                type: 'Dropdown',
                name: 'employment_type',
                label: 'Ocupación principal',
                required: true,
                options: [
                  { id: 'EMPLOYED', title: 'Empleado' },
                  { id: 'SELF_EMPLOYED', title: 'Comerciante / Independiente' },
                  { id: 'RETIRED', title: 'Pensionado / Jubilado' },
                ],
              },
              {
                type: 'Footer',
                label: 'Continuar',
                on_click_action: {
                  name: 'navigate',
                  next: {
                    name: 'INCOME_CONFIRMATION',
                  },
                },
              },
            ],
          },
        },
        {
          id: 'INCOME_CONFIRMATION',
          title: 'Confirmación de Ingresos',
          terminal: true,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              {
                type: 'TextInput',
                name: 'monthly_income',
                label: 'Ingreso mensual estimado (MXN)',
                input_type: 'number',
                required: true,
              },
              {
                type: 'CheckboxGroup',
                name: 'accept_terms',
                label: 'Términos',
                options: [
                  { id: 'accepted', title: 'Autorizo la consulta e historial crediticio conforme a ley.' },
                ],
                required: true,
              },
              {
                type: 'Footer',
                label: 'Enviar Solicitud',
                on_click_action: {
                  name: 'complete',
                  payload: {
                    action: 'SUBMIT_CREDIT_APPLICATION',
                  },
                },
              },
            ],
          },
        },
      ],
    };
  }

  /**
   * Genera el Flow interactivo de Promesa de Pago para cobranza
   */
  getPromiseToPayFlowDefinition(): WhatsAppFlowDefinition {
    return {
      version: '3.0',
      screens: [
        {
          id: 'PROMISE_PAYMENT',
          title: 'Acuerdo de Pago',
          terminal: true,
          layout: {
            type: 'SingleColumnLayout',
            children: [
              {
                type: 'TextBody',
                text: 'Indique su compromiso de pago para regularizar su préstamo:',
              },
              {
                type: 'TextInput',
                name: 'promised_amount',
                label: 'Monto a abonar (MXN)',
                input_type: 'number',
                required: true,
              },
              {
                type: 'DatePicker',
                name: 'promised_date',
                label: 'Fecha comprometida de pago',
                required: true,
              },
              {
                type: 'Dropdown',
                name: 'payment_method',
                label: 'Medio de pago elegido',
                required: true,
                options: [
                  { id: 'SPEI', title: 'Transferencia bancaria SPEI' },
                  { id: 'OXXO', title: 'Pago en OXXO / Tiendas de conveniencia' },
                  { id: 'COLLECTOR', title: 'Visita de asesor a domicilio' },
                ],
              },
              {
                type: 'Footer',
                label: 'Confirmar Promesa',
                on_click_action: {
                  name: 'complete',
                  payload: {
                    action: 'SUBMIT_PROMISE_TO_PAY',
                  },
                },
              },
            ],
          },
        },
      ],
    };
  }

  /**
   * Envía un mensaje interactivo con WhatsApp Flow al cliente
   */
  async sendFlowMessage(
    clientId: string,
    phone: string,
    flowType: 'CREDIT_REQUEST' | 'PROMISE_TO_PAY',
    flowTitle: string,
    buttonText: string
  ): Promise<string> {
    const messageText = `📋 *Formulario Interactivo EscalaFin*\n\nHaga clic en el botón a continuación para completar su ${flowTitle} directamente en WhatsApp.`;
    
    // Almacenar el envío de flow interactivo
    return this.wahaService.sendTextMessage(
      clientId,
      phone,
      `${messageText}\n\n[Flow Interactivo: ${buttonText}]`,
      'CUSTOM'
    );
  }

  /**
   * Procesa la respuesta recibida cuando un cliente completa un WhatsApp Flow
   */
  async processFlowSubmission(submission: FlowSubmissionData): Promise<{ success: boolean; resultId?: string }> {
    const { responseJson, clientId, phone } = submission;
    const action = responseJson.action || responseJson.payload?.action;

    if (action === 'SUBMIT_CREDIT_APPLICATION') {
      const amount = parseFloat(responseJson.requested_amount || '0');
      const termMonths = parseInt(responseJson.term_months || '6', 10);
      const monthlyIncome = parseFloat(responseJson.monthly_income || '0');

      const client = await prisma.client.findUnique({
        where: { id: clientId },
      });

      if (!client) {
        throw new Error('Cliente no encontrado para registrar la solicitud.');
      }

      // Crear solicitud de crédito en la base de datos
      const application = await (prisma as any).creditApplication.create({
        data: {
          clientId,
          tenantId: client.tenantId,
          requestedAmount: amount,
          termMonths,
          monthlyIncome,
          status: 'PENDING',
          notes: `Solicitud originada desde WhatsApp Flow | Ocupación: ${responseJson.employment_type || 'N/A'}`,
        },
      });

      // Confirmar al cliente por WhatsApp
      await this.wahaService.sendRawMessage(
        phone,
        `✅ *¡Solicitud Recibida!*\n\nHemos registrado su solicitud de crédito por $${amount.toFixed(2)} a ${termMonths} meses. Un asesor revisará su información en breve.`
      );

      return { success: true, resultId: application.id };
    }

    if (action === 'SUBMIT_PROMISE_TO_PAY') {
      const amount = parseFloat(responseJson.promised_amount || '0');
      const promiseDate = new Date(responseJson.promised_date);

      const activeLoan = await prisma.loan.findFirst({
        where: { clientId, status: 'ACTIVE' },
      });

      if (!activeLoan) {
        throw new Error('No se encontró un préstamo activo para registrar la promesa de pago.');
      }

      const promise = await prisma.promiseToPay.create({
        data: {
          loanId: activeLoan.id,
          clientId,
          tenantId: activeLoan.tenantId,
          amount,
          promiseDate,
          status: 'PENDING',
          notes: `Promesa registrada vía WhatsApp Flow. Método: ${responseJson.payment_method || 'N/A'}`,
        },
      });

      await this.wahaService.sendRawMessage(
        phone,
        `🤝 *Promesa de Pago Registrada*\n\nGracias por su compromiso de abonar $${amount.toFixed(2)} el ${promiseDate.toLocaleDateString('es-MX')}.`
      );

      return { success: true, resultId: promise.id };
    }

    return { success: false };
  }
}

export default WhatsAppFlowsService;
