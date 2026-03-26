
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { clientId, outcome, notes, promiseDate, location } = await request.json();

    // Crear registro de la visita
    const visit = await prisma.collectionVisit.create({
      data: {
        loanId: params.id,
        clientId: clientId,
        advisorId: session.user.id,
        visitDate: new Date(),
        outcome: outcome,
        notes: notes,
        promiseDate: promiseDate ? new Date(promiseDate) : null,
        latitude: location.includes(',') ? parseFloat(location.split(',')[0]) : null,
        longitude: location.includes(',') ? parseFloat(location.split(',')[1]) : null,
      },
    });

    // Si hay una promesa de pago, crearla también
    if (promiseDate) {
      await prisma.promiseToPay.create({
        data: {
          loanId: params.id,
          clientId: clientId,
          promiseDate: new Date(promiseDate),
          amount: 0, // Se puede dejar en 0 o el monto de la cuota
          status: 'PENDING',
          notes: `Promesa registrada tras visita: ${outcome}. ${notes}`,
          collectionVisitId: visit.id,
        },
      });
    }

    // Registrar en el log de auditoria
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'VISIT_RECORDED_NO_PAYMENT',
        resource: 'LOAN',
        resourceId: params.id,
        details: `Incidencia registrada: ${outcome}. Notas: ${notes}`,
        metadata: JSON.stringify({ visitId: visit.id, outcome, promiseDate }),
      },
    });

    return NextResponse.json({ success: true, visit });
  } catch (error) {
    console.error('Error recording visit:', error);
    return NextResponse.json(
      { error: 'Error al registrar la incidencia' },
      { status: 500 }
    );
  }
}
