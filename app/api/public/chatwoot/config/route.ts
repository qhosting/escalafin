
import { NextRequest, NextResponse } from 'next/server';
import { getChatwootConfig } from '@/lib/chatwoot';

/**
 * Endpoint público para obtener configuración de Chatwoot
 * Solo devuelve información necesaria para el widget (no tokens sensibles)
 */
export async function GET(request: NextRequest) {
  try {
    const config = await getChatwootConfig();
    
    // Solo devolver información pública necesaria para el widget
    return NextResponse.json({
      baseUrl: config.baseUrl,
      websiteToken: config.websiteToken,
      enabled: config.enabled,
      isConfigured: !!(config.baseUrl && config.websiteToken),
    });
  } catch (error: any) {
    console.error('Error fetching public Chatwoot config:', error);
    
    // En caso de error, devolver configuración deshabilitada
    return NextResponse.json({
      baseUrl: '',
      websiteToken: '',
      enabled: false,
      isConfigured: false,
    });
  }
}
