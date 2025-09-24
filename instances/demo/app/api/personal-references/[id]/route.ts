
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { RelationshipType, NotificationPreference } from '@prisma/client';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'ASESOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const data = await request.json();
    
    // Validate reference exists
    const existingReference = await prisma.personalReference.findUnique({
      where: { id: params.id },
    });

    if (!existingReference) {
      return NextResponse.json(
        { error: 'Referencia no encontrada' },
        { status: 404 }
      );
    }

    // Update personal reference
    const reference = await prisma.personalReference.update({
      where: { id: params.id },
      data: {
        fullName: data.fullName || existingReference.fullName,
        relationship: (data.relationship as RelationshipType) || existingReference.relationship,
        relationshipOther: data.relationshipOther !== undefined ? data.relationshipOther : existingReference.relationshipOther,
        phone: data.phone || existingReference.phone,
        address: data.address !== undefined ? data.address : existingReference.address,
        notificationPreference: (data.notificationPreference as NotificationPreference) || existingReference.notificationPreference,
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
        action: 'UPDATE_PERSONAL_REFERENCE',
        resource: 'PersonalReference',
        resourceId: reference.id,
        details: JSON.stringify({
          clientId: reference.clientId,
          changes: data,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json(reference);
  } catch (error) {
    console.error('Error updating personal reference:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user || !['ADMIN', 'ASESOR'].includes(session.user.role)) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Validate reference exists
    const existingReference = await prisma.personalReference.findUnique({
      where: { id: params.id },
    });

    if (!existingReference) {
      return NextResponse.json(
        { error: 'Referencia no encontrada' },
        { status: 404 }
      );
    }

    // Soft delete - mark as inactive instead of deleting
    const reference = await prisma.personalReference.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        userEmail: session.user.email!,
        action: 'DELETE_PERSONAL_REFERENCE',
        resource: 'PersonalReference',
        resourceId: reference.id,
        details: JSON.stringify({
          clientId: reference.clientId,
          fullName: reference.fullName,
        }),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent') || 'unknown',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting personal reference:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
