

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { UserRole, UserStatus } from '@prisma/client';
import { UsageTracker } from '@/lib/billing/usage-tracker';
import { AuditLogger } from '@/lib/audit';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const body = await request.json();
    const { status, firstName, lastName, phone, role } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Prevent changing admin status or role of other admins if not super admin
    // (In this case, we only have ADMIN role in context, so we prevent editing admins)
    if (existingUser.role === UserRole.ADMIN && existingUser.id !== session.user.id) {
      // Only allow self-editing for basic info if needed, but here we follow the existing pattern
      // of protecting admins.
      return NextResponse.json(
        { error: 'No se puede modificar la configuración de otros administradores' },
        { status: 403 }
      );
    }

    // Prepare update data
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (status) updateData.status = status as UserStatus;
    if (firstName) updateData.firstName = firstName;
    if (lastName) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phone = phone;
    if (role && role !== UserRole.SUPER_ADMIN) updateData.role = role as UserRole;

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        role: true,
        status: true,
      },
    });

    // Audit log
    await AuditLogger.quickLog(request, 'USER_UPDATE', {
      userEmail: updatedUser.email,
      updates: body
    }, 'User', updatedUser.id, session);

    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: 'Estado actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Error al actualizar usuario' },
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
    if (!session?.user || session.user.role !== UserRole.ADMIN) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id },
      include: {
        clientsAssigned: true,
        creditApplicationsCreated: true,
      }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Prevent self-deletion
    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes eliminar tu propia cuenta' },
        { status: 400 }
      );
    }

    // Prevent deleting admin
    if (existingUser.role === UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'No se pueden eliminar administradores' },
        { status: 400 }
      );
    }

    // Check if user has associated data
    if (existingUser.clientsAssigned.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un usuario con clientes asignados' },
        { status: 400 }
      );
    }

    if (existingUser.creditApplicationsCreated.length > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar un usuario con solicitudes de crédito asociadas' },
        { status: 400 }
      );
    }

    // Delete user
    await prisma.user.delete({
      where: { id: params.id }
    });

    // 📉 Decrementar uso en SaaS
    if (session.user.tenantId) {
      await UsageTracker.decrementUsage(session.user.tenantId, 'usersCount');
    }

    // Audit log
    await AuditLogger.quickLog(request, 'USER_DELETE', {
      userEmail: existingUser.email
    }, 'User', params.id, session);

    return NextResponse.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Error al eliminar usuario' },
      { status: 500 }
    );
  }
}
