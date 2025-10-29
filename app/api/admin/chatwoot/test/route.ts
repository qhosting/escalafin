
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { getChatwootClient } from '@/lib/chatwoot';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Solo admins pueden probar
    const user = await prisma.user.findUnique({
      where: { email: session.user?.email || '' },
    });

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const client = await getChatwootClient();
    const result = await client.testConnection();

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error testing Chatwoot:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Error al probar conexión',
      },
      { status: 500 }
    );
  }
}
