
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import EvolutionAPIService from '@/lib/evolution-api';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || session.user.role !== 'ADMIN') {
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

    const evolutionAPI = new EvolutionAPIService();
    
    // Probar el estado de la instancia
    const instanceStatus = await evolutionAPI.getInstanceStatus();
    
    // Enviar mensaje de prueba
    const messageId = await evolutionAPI.sendTextMessage(
      'test-client-id',
      testPhone,
      testMessage,
      'CUSTOM'
    );

    return NextResponse.json({
      success: true,
      message: 'Mensaje de prueba enviado exitosamente',
      messageId,
      instanceStatus
    });
  } catch (error: any) {
    console.error('Error en prueba de EvolutionAPI:', error);
    return NextResponse.json(
      { 
        error: 'Error enviando mensaje de prueba',
        details: error.message 
      },
      { status: 500 }
    );
  }
}
