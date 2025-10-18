
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';

/**
 * Health Check Endpoint
 * 
 * Este endpoint verifica:
 * - Que la aplicación esté respondiendo
 * - Que la base de datos esté conectada
 * - El estado general del sistema
 * 
 * @returns {Object} Estado de salud del sistema
 */
export async function GET() {
  try {
    // Verificar conexión a base de datos
    await prisma.$queryRaw`SELECT 1`;
    
    // Contar usuarios para verificar que la BD tiene datos
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      users: userCount,
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    });
  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 503 });
  }
}
