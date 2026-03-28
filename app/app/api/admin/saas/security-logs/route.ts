
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit';

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const auditLogger = new AuditLogger(prisma);
    const logs = await auditLogger.getLogs({
      action: 'SECURITY_BLOCK',
      limit: 100
    });

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error fetching security logs:', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}
