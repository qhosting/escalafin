
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { prisma } from '@/lib/prisma';
import { uploadFile, deleteFile, getStorageType } from '@/lib/unified-storage';

/**
 * POST /api/clients/[id]/profile-image
 * Sube o actualiza la imagen de perfil de un cliente
 * 
 * Reglas:
 * - Cliente solo puede subir al registrarse (cuando no tiene imagen)
 * - Admin puede cambiar la imagen en cualquier momento
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const clientId = params.id;

    // Obtener el cliente
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        userId: true,
        profileImage: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Verificar permisos
    const isAdmin = session.user.role === 'ADMIN';
    const isClientOwner = client.userId === session.user.id;

    if (!isAdmin && !isClientOwner) {
      return NextResponse.json(
        { error: 'No tiene permisos para subir esta imagen' },
        { status: 403 }
      );
    }

    // Si es el cliente mismo, solo puede subir si no tiene imagen
    if (isClientOwner && !isAdmin && client.profileImage) {
      return NextResponse.json(
        { error: 'Solo puede subir la foto al registrarse. Contacte al administrador para cambiarla.' },
        { status: 403 }
      );
    }

    // Obtener el archivo de FormData
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No se proporcionó ningún archivo' },
        { status: 400 }
      );
    }

    // Validar tipo de archivo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Tipo de archivo no permitido. Solo se permiten imágenes (JPEG, PNG, WebP)' },
        { status: 400 }
      );
    }

    // Validar tamaño (máximo 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'El archivo es demasiado grande. Máximo 5MB' },
        { status: 400 }
      );
    }

    // Convertir a Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Generar nombre de archivo único
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `profile-${clientId}-${timestamp}.${extension}`;

    // Subir archivo usando unified-storage
    const uploadResult = await uploadFile(
      buffer,
      fileName,
      file.type,
      {
        clientId: client.id,
        clientName: `${client.firstName} ${client.lastName}`,
        subfolder: 'profile',
      }
    );

    if (!uploadResult.success) {
      return NextResponse.json(
        { error: uploadResult.error || 'Error al subir el archivo' },
        { status: 500 }
      );
    }

    // Si el cliente ya tenía una imagen, eliminar la anterior
    if (client.profileImage) {
      try {
        const storageType = getStorageType();
        await deleteFile(client.profileImage, storageType);
      } catch (error) {
        console.warn('Error al eliminar imagen anterior:', error);
        // No fallar la operación por esto
      }
    }

    // Actualizar el cliente con la nueva ruta de imagen
    const updatedClient = await prisma.client.update({
      where: { id: clientId },
      data: {
        profileImage: uploadResult.path,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Imagen de perfil actualizada correctamente',
      client: updatedClient,
      storage: uploadResult.storage,
    });

  } catch (error: any) {
    console.error('Error en POST /api/clients/[id]/profile-image:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/clients/[id]/profile-image
 * Elimina la imagen de perfil de un cliente
 * Solo admin puede eliminar
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    // Solo admin puede eliminar
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'Solo el administrador puede eliminar imágenes de perfil' },
        { status: 403 }
      );
    }

    const clientId = params.id;

    // Obtener el cliente
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        profileImage: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    if (!client.profileImage) {
      return NextResponse.json(
        { error: 'El cliente no tiene imagen de perfil' },
        { status: 400 }
      );
    }

    // Eliminar archivo del almacenamiento
    try {
      const storageType = getStorageType();
      await deleteFile(client.profileImage, storageType);
    } catch (error) {
      console.warn('Error al eliminar archivo de almacenamiento:', error);
      // Continuar con la actualización de la base de datos
    }

    // Actualizar el cliente eliminando la referencia
    await prisma.client.update({
      where: { id: clientId },
      data: {
        profileImage: null,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Imagen de perfil eliminada correctamente',
    });

  } catch (error: any) {
    console.error('Error en DELETE /api/clients/[id]/profile-image:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/clients/[id]/profile-image
 * Obtiene la URL de la imagen de perfil del cliente
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'No autorizado' },
        { status: 401 }
      );
    }

    const clientId = params.id;

    const client = await prisma.client.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        profileImage: true,
      },
    });

    if (!client) {
      return NextResponse.json(
        { error: 'Cliente no encontrado' },
        { status: 404 }
      );
    }

    // Si no tiene imagen, devolver null
    if (!client.profileImage) {
      return NextResponse.json({
        success: true,
        profileImage: null,
      });
    }

    // Devolver la ruta de la imagen
    // En el frontend se usará para mostrar la imagen
    return NextResponse.json({
      success: true,
      profileImage: client.profileImage,
      storage: getStorageType(),
    });

  } catch (error: any) {
    console.error('Error en GET /api/clients/[id]/profile-image:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor', details: error.message },
      { status: 500 }
    );
  }
}
