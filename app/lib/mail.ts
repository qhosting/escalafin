
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_SERVER_HOST,
    port: parseInt(process.env.EMAIL_SERVER_PORT || '587'),
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
    secure: process.env.EMAIL_SERVER_PORT === '465',
});

const FROM_EMAIL = process.env.EMAIL_FROM || 'EscalaFin <noreply@escalafin.com>';

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
    try {
        if (!process.env.EMAIL_SERVER_HOST) {
            console.log('📧 Mock Email to:', to, 'Subject:', subject);
            return { success: true, mock: true };
        }

        const info = await transporter.sendMail({
            from: FROM_EMAIL,
            to,
            subject,
            html,
        });
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
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
