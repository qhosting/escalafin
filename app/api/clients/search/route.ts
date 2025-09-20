
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status') || undefined;

    if (!query) {
      return NextResponse.json({ error: 'Parámetro de búsqueda requerido' }, { status: 400 });
    }

    // Build search conditions
    const searchConditions: any = {
      OR: [
        { firstName: { contains: query, mode: 'insensitive' as const } },
        { lastName: { contains: query, mode: 'insensitive' as const } },
        { email: { contains: query, mode: 'insensitive' as const } },
        { phone: { contains: query, mode: 'insensitive' as const } }
      ]
    };

    // Add status filter if provided
    if (status) {
      searchConditions.status = status;
    }

    // For non-admin users, limit to their assigned clients
    if (session.user.role !== 'ADMIN') {
      searchConditions.asesorId = session.user.id;
    }

    const clients = await prisma.client.findMany({
      where: searchConditions,
      include: {
        _count: {
          select: {
            loans: true,
            creditApplications: true
          }
        },
        creditScores: {
          select: { score: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      take: limit,
      orderBy: [
        { status: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    // Format response
    const formattedClients = clients.map((client: any) => ({
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      address: client.address,
      status: client.status,
      creditScore: client.creditScores[0]?.score || null,
      _count: client._count
    }));

    return NextResponse.json({
      success: true,
      clients: formattedClients,
      total: clients.length,
      query
    });

  } catch (error) {
    console.error('Error searching clients:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
