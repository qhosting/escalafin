
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
  secure: process.env.EMAIL_SERVER_PORT === '465',
  connectionTimeout: 20000, // 20 segundos
  greetingTimeout: 20000,
});

export async function sendEmail({
  to,
  subject,
  html,
  fromName,
  replyTo
}: {
  to: string;
  subject: string;
  html: string;
  fromName?: string;
  replyTo?: string;
}) {
  try {
    if (!process.env.EMAIL_SERVER_HOST) {
      console.log(`📧 [MOCK] From: ${fromName || 'EscalaFin'} | To: ${to} | Subject: ${subject}`);
      return { success: true, mock: true };
    }

    const defaultFrom = process.env.EMAIL_FROM || 'noreply@escalafin.com';
    const from = fromName ? `${fromName} <${defaultFrom.includes('<') ? defaultFrom.split('<')[1].split('>')[0] : defaultFrom}>` : defaultFrom;

    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
      replyTo: replyTo || undefined
    });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}

export class MailService {
  /**
   * Helper para enviar correos directamente sin plantillas específicas iniciales.
   */
  static async sendEmailDirect(data: { to: string; subject: string; html: string; fromName?: string }) {
    return sendEmail(data);
  }

  static async sendWelcomeEmail(to: string, userName: string, companyName: string) {
    const template = emailTemplates.welcomeTenant(userName, companyName);
    return sendEmail({ to, ...template });
  }

  static async sendLimitWarningEmail(data: {
    to: string;
    userName: string;
    companyName: string;
    resourceName: string;
    currentUsage: number;
    limit: number;
    percent: number;
    upgradeUrl: string;
  }) {
    const isCritical = data.percent >= 100;
    const color = isCritical ? '#ef4444' : '#f59e0b';
    const title = isCritical ? '¡Límite Alcanzado!' : 'Atención: Cerca del límite';

    const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: ${color};">${title}</h2>
                <p>Hola ${data.userName},</p>
                <p>Te informamos que tu organización <strong>${data.companyName}</strong> ha utilizado el <strong>${data.percent}%</strong> de su capacidad de <strong>${data.resourceName}</strong>.</p>
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f3f4f6;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span style="font-size: 14px; color: #6b7280;">Uso Actual</span>
                        <span style="font-size: 14px; font-weight: bold;">${data.currentUsage} / ${data.limit === -1 ? 'Ilimitado' : data.limit}</span>
                    </div>
                    <div style="width: 100%; height: 8px; bg-color: #e5e7eb; border-radius: 4px; overflow: hidden;">
                        <div style="width: ${Math.min(data.percent, 100)}%; height: 100%; background-color: ${color}; border-radius: 4px;"></div>
                    </div>
                </div>
                <p>Para asegurar que tu operación no se detenga, te recomendamos mejorar tu plan actual.</p>
                <a href="${data.upgradeUrl}" style="display: inline-block; background-color: ${color}; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Mejorar Suscripción</a>
            </div>
        `;

    return sendEmail({
      to: data.to,
      subject: `[Alerta EscalaFin] ${data.percent}% de uso de ${data.resourceName}`,
      html
    });
  }

  static async sendInvoiceEmail(to: string, data: {
    invoiceNumber: string,
    amount: number,
    dueDate: string,
    companyName: string
  }) {
    const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #4f46e5;">Nueva Factura Generada</h2>
                <p>Hola,</p>
                <p>Se ha generado una nueva factura por el servicio de EscalaFin para <strong>${data.companyName}</strong>.</p>
                <div style="background-color: #f9fafb; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #f3f4f6;">
                    <p style="margin: 5px 0;"><strong>Factura:</strong> ${data.invoiceNumber}</p>
                    <p style="margin: 5px 0;"><strong>Monto:</strong> $${data.amount.toLocaleString('es-MX')}</p>
                    <p style="margin: 5px 0;"><strong>Fecha de Vencimiento:</strong> ${data.dueDate}</p>
                </div>
                <p>Puedes ver y pagar esta factura desde tu panel de administración.</p>
                <a href="${process.env.NEXTAUTH_URL}/admin/billing" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Ver Factura</a>
            </div>
        `;

    return sendEmail({
      to,
      subject: `Nueva Factura ${data.invoiceNumber} - EscalaFin`,
      html
    });
  }

  static async sendSubscriptionExpiringSoon(to: string, data: {
    companyName: string,
    daysRemaining: number,
    upgradeUrl: string
  }) {
    const html = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
                <h2 style="color: #f59e0b;">Aviso de Suscripción</h2>
                <p>Tu suscripción para <strong>${data.companyName}</strong> vencerá en <strong>${data.daysRemaining} días</strong>.</p>
                <p>Para evitar interrupciones en el servicio, asegúrate de que tu método de pago esté actualizado o renueva tu plan.</p>
                <a href="${data.upgradeUrl}" style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Gestionar Suscripción</a>
            </div>
        `;

    return sendEmail({
      to,
      subject: `Aviso de Vencimiento - ${data.companyName}`,
      html
    });
  }

  /**
   * Genera un diseño de correo con el branding del tenant
   */
  private static getBrandedLayout(content: string, tenant: { name: string, logo?: string | null, primaryColor?: string | null }) {
    const color = tenant.primaryColor || '#4f46e5';
    const logo = tenant.logo || `${process.env.NEXTAUTH_URL}/logoescalafin.png`;

    return `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa; padding: 40px 0; color: #333;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td align="center" style="padding: 30px 40px; border-bottom: 1px solid #f0f0f0;">
              <img src="${logo}" alt="${tenant.name}" style="max-height: 50px; display: block;" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              ${content}
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 30px 40px; background-color: #fafbfc; border-top: 1px solid #f0f0f0; text-align: center;">
              <p style="margin: 0; font-size: 13px; color: #9ca3af;">
                Enviado por <strong>${tenant.name}</strong> a través de EscalaFin.
              </p>
              <p style="margin: 5px 0 0 0; font-size: 11px; color: #d1d5db;">
                No respondas a este correo. Para soporte, contacta directamente con tu financiera.
              </p>
            </td>
          </tr>
        </table>
      </div>
    `;
  }

  /**
   * Envía un recibo de pago con marca de financiera
   */
  static async sendPaymentReceipt(to: string, data: {
    amount: number,
    date: string,
    loanNumber: string,
    clientName: string
  }, tenant: { name: string, logo?: string | null, primaryColor?: string | null }) {

    const content = `
      <h2 style="color: ${tenant.primaryColor || '#333'}; margin-top: 0;">Recibo de Pago Confirmado</h2>
      <p>Hola <strong>${data.clientName}</strong>,</p>
      <p>Tu pago ha sido registrado exitosamente en nuestro sistema.</p>
      
      <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 20px; margin: 25px 0;">
        <table width="100%" cellpadding="5">
          <tr>
            <td style="color: #6b7280; font-size: 14px;">Monto Pagado:</td>
            <td align="right" style="font-weight: bold; font-size: 18px; color: ${tenant.primaryColor || '#111'};">$${data.amount.toLocaleString('es-MX')}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; font-size: 14px;">Fecha:</td>
            <td align="right" style="font-weight: bold;">${data.date}</td>
          </tr>
          <tr>
            <td style="color: #6b7280; font-size: 14px;">Referencia Préstamo:</td>
            <td align="right" style="font-weight: bold;">${data.loanNumber}</td>
          </tr>
        </table>
      </div>
      
      <p style="font-size: 14px; line-height: 1.6;">Gracias por tu cumplimiento. Esto te ayuda a mantener un excelente historial crediticio con nosotros.</p>
    `;

    return sendEmail({
      to,
      subject: `Recibo de Pago - ${tenant.name}`,
      html: this.getBrandedLayout(content, tenant),
      fromName: tenant.name
    });
  }
}

export const emailTemplates = {
  welcomeTenant: (name: string, company: string) => ({
    subject: `¡Bienvenido a EscalaFin, ${name}!`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h1 style="color: #4f46e5;">¡Felicidades por registrar ${company}!</h1>
        <p>Hola ${name}, estamos muy emocionados de que hayas elegido EscalaFin para gestionar tu financiera.</p>
        <p>Tu cuenta ha sido creada exitosamente y ya tienes acceso a tu panel de administración.</p>
        <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold;">Tu periodo de prueba de 14 días ha comenzado.</p>
            <p style="margin: 5px 0 0 0; font-size: 14px; color: #6b7280;">Tienes acceso total a todas las funciones durante este tiempo.</p>
        </div>
        <a href="${process.env.NEXTAUTH_URL}/auth/login" style="display: inline-block; background-color: #4f46e5; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Ir a mi Dashboard</a>
        <hr style="margin-top: 30px; border: 0; border-top: 1px solid #eee;" />
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">EscalaFin SaaS - La plataforma líder en gestión de créditos.</p>
      </div>
    `
  }),
  trialExpiringSoon: (company: string, daysRemaining: number) => ({
    subject: `Tu periodo de prueba termina en ${daysRemaining} días`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #f59e0b;">Recordatorio de Suscripción</h2>
        <p>El periodo de prueba para <strong>${company}</strong> termina pronto.</p>
        <p>Te quedan <strong>${daysRemaining} días</strong> para seguir disfrutando de EscalaFin.</p>
        <p>Para evitar interrupciones en tu servicio, te recomendamos actualizar a un plan profesional.</p>
        <a href="${process.env.NEXTAUTH_URL}/admin/billing/subscription" style="display: inline-block; background-color: #f59e0b; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Actualizar Plan</a>
      </div>
    `
  }),
  limitReached: (company: string, resource: string) => ({
    subject: `¡Alerta de Límite! Has alcanzado el límite de ${resource}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
        <h2 style="color: #ef4444;">Acción Requerida</h2>
        <p>Tu organización <strong>${company}</strong> ha alcanzado el límite de <strong>${resource}</strong> permitido en tu plan actual.</p>
        <p>Para seguir registrando más elementos, es necesario subir de nivel tu suscripción.</p>
        <a href="${process.env.NEXTAUTH_URL}/admin/billing/subscription" style="display: inline-block; background-color: #ef4444; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 10px;">Mejorar Plan</a>
      </div>
    `
  })
};
