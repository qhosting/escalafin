import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getChatwootConfig } from '@/lib/chatwoot';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden acceder
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || '' },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Obtener configuración de Chatwoot (await necesario)
    const config = await getChatwootConfig();
    const source = await getConfigSource();
    
    // Preparar respuesta
    const response = {
      baseUrl: config.baseUrl || '',
      websiteToken: config.websiteToken || '',
      accountId: config.accountId || '1',
      apiAccessToken: config.apiAccessToken ? '***' : undefined,
      enabled: config.enabled || false,
      isConfigured: !!(config.baseUrl && config.websiteToken),
      source: source,
    };
    
    return NextResponse.json(response);
  } catch (error: any) {
    console.error('Error fetching Chatwoot config:', error);
    return NextResponse.json(
      { error: 'Error al obtener configuración' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden modificar
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || '' },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { baseUrl, websiteToken, accountId, apiAccessToken, enabled } = body;

    // Validar campos requeridos
    if (!baseUrl || !websiteToken) {
      return NextResponse.json(
        { error: 'baseUrl y websiteToken son requeridos' },
        { status: 400 }
      );
    }

    // Guardar en base de datos
    const configs = [
      {
        key: 'chatwoot_base_url',
        value: baseUrl,
        description: 'URL base de la instancia de Chatwoot',
        category: 'chatwoot',
      },
      {
        key: 'chatwoot_website_token',
        value: websiteToken,
        description: 'Token del website para el widget de Chatwoot',
        category: 'chatwoot',
      },
      {
        key: 'chatwoot_account_id',
        value: accountId || '1',
        description: 'ID de la cuenta en Chatwoot',
        category: 'chatwoot',
      },
      {
        key: 'chatwoot_enabled',
        value: String(enabled !== false),
        description: 'Habilitar/deshabilitar Chatwoot',
        category: 'chatwoot',
      },
    ];

    if (apiAccessToken && apiAccessToken !== '***') {
      configs.push({
        key: 'chatwoot_api_access_token',
        value: apiAccessToken,
        description: 'Token de acceso a la API de Chatwoot',
        category: 'chatwoot',
      });
    }

    // Usar upsert para crear o actualizar
    for (const config of configs) {
      await prisma.systemConfig.upsert({
        where: { key: config.key },
        create: {
          ...config,
          updatedBy: user.id,
        },
        update: {
          value: config.value,
          updatedBy: user.id,
          updatedAt: new Date(),
        },
      });
    }

    // Obtener configuración actualizada
    const updatedConfig = await getChatwootConfig();
    
    // Preparar respuesta
    const responseData = {
      success: true,
      message: 'Configuración guardada exitosamente',
      config: {
        baseUrl: updatedConfig.baseUrl || '',
        websiteToken: updatedConfig.websiteToken || '',
        accountId: updatedConfig.accountId || '1',
        apiAccessToken: updatedConfig.apiAccessToken ? '***' : undefined,
        enabled: updatedConfig.enabled || false,
        isConfigured: true,
      },
    };
    
    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error('Error saving Chatwoot config:', error);
    return NextResponse.json(
      { error: 'Error al guardar configuración' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden eliminar
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || '' },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Eliminar todas las configuraciones de Chatwoot
    await prisma.systemConfig.deleteMany({
      where: {
        key: {
          in: [
            'chatwoot_base_url',
            'chatwoot_website_token',
            'chatwoot_account_id',
            'chatwoot_api_access_token',
            'chatwoot_enabled',
          ],
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Configuración eliminada exitosamente',
    });
  } catch (error: any) {
    console.error('Error deleting Chatwoot config:', error);
    return NextResponse.json(
      { error: 'Error al eliminar configuración' },
      { status: 500 }
    );
  }
}

async function getConfigSource(): Promise<'database' | 'environment' | 'none'> {
  try {
    const dbConfig = await prisma.systemConfig.findFirst({
      where: { key: 'chatwoot_base_url' },
    });

    if (dbConfig?.value) {
      return 'database';
    }

    if (process.env.CHATWOOT_BASE_URL) {
      return 'environment';
    }

    return 'none';
  } catch (error) {
    return process.env.CHATWOOT_BASE_URL ? 'environment' : 'none';
  }
}
