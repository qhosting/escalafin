
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { identifier, otp, newPassword } = await request.json();

    if (!identifier || !otp || !newPassword) {
      return NextResponse.json({ error: 'Todos los campos son obligatorios' }, { status: 400 });
    }

    // 1. Buscar usuario
    const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: identifier },
            { phone: identifier }
          ]
        }
    });

    if (!user) {
        return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // 2. Verificar Token
    const verificationToken = await prisma.verificationToken.findFirst({
      where: {
        identifier: user.id,
        token: otp
      }
    });

    if (!verificationToken) {
      return NextResponse.json({ error: 'Código de verificación inválido' }, { status: 400 });
    }

    // 3. Verificar Expiración
    if (new Date() > verificationToken.expires) {
      return NextResponse.json({ error: 'El código ha expirado' }, { status: 400 });
    }

    // 4. Actualizar Contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword }
    });

    // 5. Eliminar Token usado
    await prisma.verificationToken.deleteMany({
      where: { identifier: user.id }
    });

    return NextResponse.json({ message: 'Contraseña restablecida correctamente' });

  } catch (error: any) {
    console.error('Error in Verify OTP API:', error);
    return NextResponse.json({ error: 'Error al verificar el código y cambiar contraseña' }, { status: 500 });
  }
}
