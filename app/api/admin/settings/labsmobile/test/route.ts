
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import LabsMobileService from '@/lib/labsmobile';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user || session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { phone, settings } = body;

    if (!phone) {
      return NextResponse.json(
        { success: false, message: 'Número de teléfono requerido' },
        { status: 400 }
      );
    }

    // Create service with test settings
    const labsmobile = new LabsMobileService({
      username: settings.username,
      apiToken: settings.apiToken,
      sender: settings.sender
    });

    // Send test message
    const testMessage = 'Mensaje de prueba desde EscalaFin. Tu configuración de LabsMobile funciona correctamente.';
    
    const result = await labsmobile.sendSMS({
      recipient: phone,
      message: testMessage
    });

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'SMS enviado exitosamente',
        credits: result.remainingCredits
      });
    } else {
      return NextResponse.json({
        success: false,
        message: result.error || 'Error al enviar SMS'
      });
    }

  } catch (error) {
    console.error('Error en prueba de LabsMobile:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
