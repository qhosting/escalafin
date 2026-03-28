
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit';

export async function POST(req: NextRequest) {
  try {
    // 🛡️ Seguridad interna básica
    const internalSecret = req.headers.get('x-internal-secret');
    if (internalSecret !== process.env.NEXTAUTH_SECRET) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const { ip, userAgent, path, pattern } = await req.json();

    const auditLogger = new AuditLogger(prisma);
    await auditLogger.log({
      action: 'SECURITY_BLOCK',
      resource: 'NETWORK_WAF',
      ipAddress: ip,
      userAgent: userAgent,
      details: {
        blockedPath: path,
        detectedPattern: pattern,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error recording security log:', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}
