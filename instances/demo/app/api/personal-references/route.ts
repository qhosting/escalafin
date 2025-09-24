
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { RelationshipType, NotificationPreference } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'ASESOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Validation
    if (!data.clientId || !data.fullName || !data.relationship || !data.phone) {
      return NextResponse.json(
        { error: 'Todos los campos requeridos deben ser proporcionados' },
        { status: 400 }
      );
    }

    // Validate client exists
    const client = await prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Check if client already has 2 references
    const existingReferencesCount = await prisma.personalReference.count({
      where: { 
        clientId: data.clientId,
        isActive: true 
      },
    });

    if (existingReferencesCount >= 2) {
      return NextResponse.json(
        { error: 'El cliente ya tiene el máximo de 2 referencias personales' },
        { status: 400 }
      );
    }

    // Create personal reference
    const reference = await prisma.personalReference.create({
      data: {
        clientId: data.clientId,
        fullName: data.fullName,
        relationship: data.relationship as RelationshipType,
        relationshipOther: data.relationshipOther || null,
        phone: data.phone,
        address: data.address || null,
        notificationPreference: (data.notificationPreference as NotificationPreference) || NotificationPreference.WHATSAPP,
      },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email!,
        action: 'CREATE_PERSONAL_REFERENCE',
        resource: 'PersonalReference',
        resourceId: reference.id,
        details: JSON.stringify({
          clientId: data.clientId,
          fullName: data.fullName,
          relationship: data.relationship,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(reference, { status: 201 });
  } catch (error) {
    console.error('Error creating personal reference:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get('clientId');

    if (!clientId) {
      return NextResponse.json(
        { error: 'clientId es requerido' },
        { status: 400 }
      );
    }

    // Verify client exists and user has access
    const client = await prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    const references = await prisma.personalReference.findMany({
      where: { 
        clientId: clientId,
        isActive: true 
      },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(references);
  } catch (error) {
    console.error('Error fetching personal references:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
