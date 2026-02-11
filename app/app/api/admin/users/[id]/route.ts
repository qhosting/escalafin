

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
    const { status } = body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: params.id }
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Prevent admin from changing their own status
    if (existingUser.id === session.user.id) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propio estado' },
        { status: 400 }
      );
    }

    // Prevent changing admin status
    if (existingUser.role === UserRole.ADMIN) {
      return NextResponse.json(
        { error: 'No se puede cambiar el estado de otros administradores' },
        { status: 400 }
      );
    }

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id: params.id },
      data: {
        status: status as UserStatus,
        updatedAt: new Date(),
      },
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
      newStatus: updatedUser.status
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
