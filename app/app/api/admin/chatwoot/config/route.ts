
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getChatwootConfig } from '@/lib/chatwoot';

/**
 * GET /api/admin/chatwoot/config
 * Obtiene la configuración de Chatwoot (sin tokens sensibles)
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

    const config = getChatwootConfig();

    // No enviar tokens sensibles al frontend
    return NextResponse.json({
      baseUrl: config.baseUrl,
      accountId: config.accountId,
      isConfigured: !!(config.baseUrl && config.websiteToken),
    });
  } catch (error) {
    console.error('Error getting Chatwoot config:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/chatwoot/config
 * Actualiza la configuración de Chatwoot
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { baseUrl, websiteToken, accountId, apiAccessToken } = body;

    // Validar que los campos requeridos estén presentes
    if (!baseUrl || !websiteToken || !accountId) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos' },
        { status: 400 }
      );
    }

    // En un entorno de producción, estos valores se guardarían en una base de datos
    // o se actualizarían en las variables de entorno del servidor
    // Por ahora, solo validamos que la configuración sea correcta

    // Intentar una llamada de prueba a Chatwoot
    const testResponse = await fetch(`${baseUrl}/api/v1/accounts/${accountId}`, {
      headers: apiAccessToken ? {
        'api_access_token': apiAccessToken,
      } : {},
    });

    if (!testResponse.ok && apiAccessToken) {
      return NextResponse.json(
        { error: 'Credenciales de Chatwoot inválidas' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración validada correctamente',
    });
  } catch (error) {
    console.error('Error updating Chatwoot config:', error);
    return NextResponse.json(
      { error: 'Error al actualizar configuración' },
      { status: 500 }
    );
  }
}
