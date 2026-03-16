
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const history = await prisma.customReportGeneration.findMany({
      where: { userId: session.user.id },
      include: {
        template: {
          select: { name: true, category: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('Error fetching report history:', error);
    return NextResponse.json(
      { error: 'Error al cargar el historial de reportes' },
      { status: 500 }
    );
  }
}
