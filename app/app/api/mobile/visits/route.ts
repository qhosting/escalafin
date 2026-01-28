
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const visits = await prisma.collectionVisit.findMany({
      where: {
        advisorId: session.user.id
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: {
        visitDate: 'desc'
      },
      take: 50
    });

    return NextResponse.json({ visits });
  } catch (error) {
    console.error('Error fetching visits:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { clientId, notes, outcome, latitude, longitude, address } = body;

    if (!clientId) {
      return NextResponse.json({ error: 'Cliente requerido' }, { status: 400 });
    }

    const visit = await prisma.collectionVisit.create({
      data: {
        clientId,
        advisorId: session.user.id,
        notes,
        outcome,
        latitude,
        longitude,
        address
      }
    });

    return NextResponse.json(visit);
  } catch (error) {
    console.error('Error creating visit:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
