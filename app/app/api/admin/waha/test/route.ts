
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import WahaService from '@/lib/waha';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'SUPER_ADMIN')) {
      return NextResponse.json(
        { error: 'Acceso no autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { testPhone, testMessage } = body;

    if (!testPhone || !testMessage) {
      return NextResponse.json(
        { error: 'Teléfono y mensaje son obligatorios' },
        { status: 400 }
      );
    }

    const wahaService = new WahaService(session.user.tenantId || null);

    // Probar el estado de la instancia
    const sessionStatus = await wahaService.getSessionStatus();

    // Enviar mensaje de prueba
    // Nota: 'test-client-id' debe existir en DB para crear el registro de mensaje,
    // pero si es solo prueba, quizás deberíamos manejarlo distinto.
    // Asumiremos que el service maneja la creación de mensaje en DB y requiere un cliente válido o lo crea dummy.
    // Dado el schema, clientId es obligatorio y debe existir en Client table.
    // Para prueba rápida, podemos intentar enviar sin DB record if method allows, but current implementation creates record.
    // Let's create a dummy logic or catch the specific DB error if 'test-client-id' doesn't exist,
    // but typically admin tests should probably use a valid client or we handle this in service.
    // However, for pure connection test, maybe we shouldn't create a DB record?
    // Let's stick to the interface. If it fails due to foreign key, user will know.

    let messageId = 'test-run';
    try {
        // Usamos sendRawMessage para la prueba porque no requiere un clientId existente en la DB
        await wahaService.sendRawMessage(
          testPhone,
          testMessage
        );
    } catch (e: any) {
        console.error("Waha API connection failed:", e);
        throw e;
    }

    return NextResponse.json({
      success: true,
      message: 'Mensaje de prueba enviado exitosamente',
      messageId,
      sessionStatus
    });
  } catch (error: any) {
    console.error('Error en prueba de Waha:', error);
    return NextResponse.json(
      {
        error: 'Error enviando mensaje de prueba',
        details: error.message
      },
      { status: 500 }
    );
  }
}
