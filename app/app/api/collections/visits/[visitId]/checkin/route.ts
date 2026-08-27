import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PrismaClient, UserRole } from '@prisma/client';
import { calculateHaversineDistance } from '@/lib/predictive-collection-service';

const prisma = new PrismaClient();

export async function POST(
  request: NextRequest,
  { params }: { params: { visitId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role === UserRole.CLIENTE) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { visitId } = params;
    const body = await request.json();
    const { latitude, longitude, notes, outcome, promiseDate, promiseAmount, photoUrl } = body;

    const existingVisit = await prisma.collectionVisit.findUnique({
      where: { id: visitId },
      include: {
        client: true,
        route: true,
      },
    });

    if (!existingVisit) {
      return NextResponse.json({ error: 'Visita no encontrada' }, { status: 404 });
    }

    // Calcular distancia al domicilio del cliente si ambos tienen coordenadas
    let distanceToTargetMeters: number | null = null;
    let isWithinGeofence = false;

    if (latitude && longitude && existingVisit.latitude && existingVisit.longitude) {
      distanceToTargetMeters = calculateHaversineDistance(
        latitude,
        longitude,
        existingVisit.latitude,
        existingVisit.longitude
      );
      isWithinGeofence = distanceToTargetMeters <= 200; // Geofence de 200 metros
    }

    const updatedNotes = notes
      ? `${existingVisit.notes ? existingVisit.notes + ' | ' : ''}Check-in GPS: ${new Date().toLocaleTimeString()} (Precisión: ${distanceToTargetMeters !== null ? `${distanceToTargetMeters}m` : 'N/D'}) - ${notes}`
      : existingVisit.notes;

    const visit = await prisma.collectionVisit.update({
      where: { id: visitId },
      data: {
        latitude: latitude ?? existingVisit.latitude,
        longitude: longitude ?? existingVisit.longitude,
        outcome: outcome ?? existingVisit.outcome ?? 'CHECKED_IN',
        notes: updatedNotes,
        photoUrl: photoUrl ?? existingVisit.photoUrl,
        promiseDate: promiseDate ? new Date(promiseDate) : existingVisit.promiseDate,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    // Si se incluye una promesa de pago, crear o actualizar el registro
    if (promiseDate && promiseAmount) {
      const activeLoan = await prisma.loan.findFirst({
        where: {
          clientId: visit.clientId,
          status: 'ACTIVE',
        },
      });

      if (activeLoan) {
        await prisma.promiseToPay.create({
          data: {
            loanId: activeLoan.id,
            clientId: visit.clientId,
            amount: promiseAmount,
            promiseDate: new Date(promiseDate),
            status: 'PENDING',
            notes: notes || 'Promesa registrada durante visita en campo con check-in GPS',
            collectionVisitId: visit.id,
            tenantId: session.user.tenantId,
          },
        });
      }
    }

    // Actualizar estado de la ruta a IN_PROGRESS si estaba PENDING
    if (existingVisit.routeId && existingVisit.route?.status === 'PENDING') {
      await prisma.collectionRoute.update({
        where: { id: existingVisit.routeId },
        data: { status: 'IN_PROGRESS' },
      });
    }

    return NextResponse.json({
      success: true,
      visit,
      geofence: {
        isWithinGeofence,
        distanceMeters: distanceToTargetMeters,
      },
    });
  } catch (error) {
    console.error('Error during collection visit check-in:', error);
    return NextResponse.json(
      { error: 'Error al registrar check-in de visita' },
      { status: 500 }
    );
  }
}
