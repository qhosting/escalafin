/**
 * app/api/condusef/check-reference/route.ts
 *
 * Endpoint interno consultado por el script AGI de Asterisk.
 * Verifica si un número de teléfono es de una referencia personal.
 *
 * GET /api/condusef/check-reference?phone=5512345678&clientId=xxx
 *
 * Requiere API key en header Authorization: Bearer <token>
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma }                    from '@/lib/prisma';

export async function GET(request: NextRequest) {
  // Validar token AGI (API Key del servidor Asterisk)
  const asteriskToken  = process.env.ASTERISK_AGI_TOKEN;
  const providedToken  = request.headers.get('authorization')?.replace('Bearer ', '');

  if (asteriskToken && providedToken !== asteriskToken) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const phone    = searchParams.get('phone')    ?? '';
  const clientId = searchParams.get('clientId') ?? '';

  if (!phone) {
    return NextResponse.json({ error: 'phone es requerido' }, { status: 400 });
  }

  try {
    // Limpiar el número: solo los últimos 10 dígitos
    const cleanPhone = phone.replace(/\D/g, '').slice(-10);

    // Obtener el tenant del cliente para limitar la búsqueda
    let tenantId: string | undefined;
    if (clientId) {
      const client = await prisma.client.findUnique({
        where:  { id: clientId },
        select: { tenantId: true },
      });
      tenantId = client?.tenantId ?? undefined;
    }

    // Buscar si el número aparece como referencia personal activa
    const reference = await prisma.personalReference.findFirst({
      where: {
        phone:    { contains: cleanPhone },
        isActive: true,
        ...(tenantId ? { tenantId } : {}),
      },
      select: {
        id:           true,
        fullName:     true,
        relationship: true,
        clientId:     true,
      },
    });

    if (reference) {
      // Es una referencia — NO contactar
      return NextResponse.json({
        isReference:  true,
        phone:        cleanPhone,
        referenceId:  reference.id,
        relationship: reference.relationship,
        // No revelar nombre por privacidad en el log de Asterisk
        message: 'Número registrado como referencia personal. Contacto prohibido por CONDUSEF.',
      });
    }

    // También verificar si el número es el titular de otro crédito diferente
    // En ese caso, solo se puede contactar en el contexto del crédito correcto
    return NextResponse.json({
      isReference: false,
      phone:       cleanPhone,
      message:     'Número pertenece al titular. Contacto permitido.',
    });

  } catch (error) {
    console.error('[CONDUSEF-CHECK-REF] Error:', error);
    // Fail-safe: en caso de error, permitir la llamada (no bloquear operaciones)
    return NextResponse.json({
      isReference: false,
      phone,
      error:       'Error interno — respuesta de seguridad por defecto',
    }, { status: 200 }); // 200 intencional para que el AGI procese la respuesta
  }
}
