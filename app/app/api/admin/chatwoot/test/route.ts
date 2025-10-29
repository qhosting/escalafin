
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getChatwootClient } from '@/lib/chatwoot';

/**
 * GET /api/admin/chatwoot/test
 * Prueba la conexión con Chatwoot
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const chatwoot = getChatwootClient();
    
    // Intentar obtener conversaciones como prueba
    // Esto solo funcionará si hay un API access token configurado
    const testEmail = 'test@escalafin.com';
    const contact = await chatwoot.getContactByEmail(testEmail);

    return NextResponse.json({
      success: true,
      message: 'Conexión exitosa con Chatwoot',
      hasApiAccess: !!contact || contact === null, // null significa que se pudo hacer la llamada pero no hay contacto
    });
  } catch (error) {
    console.error('Error testing Chatwoot connection:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Error al conectar con Chatwoot',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
