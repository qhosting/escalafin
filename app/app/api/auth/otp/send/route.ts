
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { MailService } from '@/lib/mail';
import { WahaService } from '@/lib/waha';
import { crypto } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const { identifier } = await request.json();

    if (!identifier) {
      return NextResponse.json({ error: 'Identificador requerido' }, { status: 400 });
    }

    // 1. Buscar usuario por email o teléfono
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: identifier },
          { phone: identifier }
        ]
      },
      include: {
        tenant: true
      }
    });

    if (!user) {
      // Por seguridad, no revelamos si el usuario existe o no
      // Pero para este flujo interno de "enviar", devolvemos éxito falso silencioso o éxito siempre
      // Aquí devolveremos un mensaje genérico de éxito para evitar enumeración, 
      // pero internamente no haremos nada.
      return NextResponse.json({ message: 'Si el usuario existe, se ha enviado un código' });
    }

    // 2. Generar OTP de 6 dígitos
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    // 3. Guardar en VerificationToken
    await prisma.verificationToken.upsert({
      where: {
        identifier_token: {
          identifier: user.id, // Usamos el ID del usuario como identificador para el Reset
          token: otp
        }
      },
      update: {
        token: otp,
        expires: expires
      },
      create: {
        identifier: user.id,
        token: otp,
        expires: expires
      }
    });

    // 4. Determinar método de envío
    const isPhone = /^\+?[0-9]{10,15}$/.test(identifier);
    const tenantName = user.tenant?.name || 'EscalaFin';

    if (isPhone || (identifier === user.phone && user.phone)) {
      // Enviar via WhatsApp
      try {
        // Los usuarios siempre usan la conexión Global de WAHA del SaaS para OTP
        const waha = new WahaService(user.tenantId, true);
        const message = `*${tenantName}* \n\nTu código de verificación es: *${otp}*\n\nEste código expira en 10 minutos. No lo compartas con nadie.`;
        await waha.sendRawMessage(user.phone || identifier, message);
      } catch (e) {
        console.error('Error sending OTP via WhatsApp:', e);
        // Si falla WhatsApp, intentar email si tiene
        if (user.email) {
           await sendOTPEmail(user.email, otp, tenantName);
        } else {
           throw new Error('No se pudo enviar el código por WhatsApp');
        }
      }
    } else {
      // Enviar via Email
      await sendOTPEmail(user.email, otp, tenantName);
    }

    return NextResponse.json({ message: 'Código enviado correctamente' });

  } catch (error: any) {
    console.error('Error in Send OTP API:', error);
    return NextResponse.json({ error: 'Error al enviar el código de verificación' }, { status: 500 });
  }
}

async function sendOTPEmail(email: string, otp: string, tenantName: string) {
  const html = `
    <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
      <h2 style="color: #4f46e5; text-align: center;">Código de Verificación</h2>
      <p>Hola,</p>
      <p>Has solicitado un código para restablecer tu contraseña en <strong>${tenantName}</strong>.</p>
      <div style="background-color: #f3f4f6; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111;">${otp}</span>
      </div>
      <p style="font-size: 14px; color: #6b7280;">Este código es válido por 10 minutos. Si no solicitaste este cambio, puedes ignorar este correo.</p>
      <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
      <p style="font-size: 12px; color: #9ca3af; text-align: center;">&copy; ${new Date().getFullYear()} ${tenantName} - Potenciado por EscalaFin</p>
    </div>
  `;

  return MailService.sendEmailDirect({
    to: email,
    subject: `Tu código de verificación: ${otp}`,
    html
  });
}
