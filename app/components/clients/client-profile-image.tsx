
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { Camera, Trash2, Upload, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';

interface ClientProfileImageProps {
  clientId: string;
  currentImage?: string | null;
  clientName: string;
  editable?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onImageUpdate?: (newImagePath: string | null) => void;
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
  xl: 'w-48 h-48',
};

export function ClientProfileImage({
  clientId,
  currentImage,
  clientName,
  editable = false,
  size = 'md',
  onImageUpdate,
}: ClientProfileImageProps) {
  const { data: session } = useSession() || {};
  const [image, setImage] = useState<string | null>(currentImage || null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAdmin = session?.user?.role === 'ADMIN';

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Solo se permiten imágenes (JPEG, PNG, WebP)');
      return;
    }

    // Validar tamaño (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error('La imagen es demasiado grande. Máximo 5MB');
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/clients/${clientId}/profile-image`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al subir la imagen');
      }

      setImage(data.client.profileImage);
      toast.success('Imagen actualizada correctamente');
      onImageUpdate?.(data.client.profileImage);

    } catch (error: any) {
      console.error('Error al subir imagen:', error);
      toast.error(error.message || 'Error al subir la imagen');
    } finally {
      setUploading(false);
      // Reset input
      event.target.value = '';
    }
  };

  const handleDeleteImage = async () => {
    if (!confirm('¿Está seguro de eliminar la imagen de perfil?')) {
      return;
    }

    setDeleting(true);

    try {
      const response = await fetch(`/api/clients/${clientId}/profile-image`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar la imagen');
      }

      setImage(null);
      toast.success('Imagen eliminada correctamente');
      onImageUpdate?.(null);

    } catch (error: any) {
      console.error('Error al eliminar imagen:', error);
      toast.error(error.message || 'Error al eliminar la imagen');
    } finally {
      setDeleting(false);
    }
  };

  const imageUrl = image ? `/api/images/${image}` : null;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Contenedor de la imagen */}
      <div className={`relative ${sizeClasses[size]} rounded-full overflow-hidden bg-muted border-2 border-border`}>
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={`Foto de ${clientName}`}
            fill
            className="object-cover"
            unoptimized // Para funcionar con rutas dinámicas
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-primary/20">
            <User className="w-1/2 h-1/2 text-muted-foreground" />
          </div>
        )}

        {/* Overlay de carga */}
        {(uploading || deleting) && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent" />
          </div>
        )}
      </div>

      {/* Botones de acción */}
      {editable && isAdmin && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={uploading || deleting}
            onClick={() => document.getElementById(`file-input-${clientId}`)?.click()}
          >
            {image ? (
              <>
                <Camera className="w-4 h-4 mr-2" />
                Cambiar
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Subir
              </>
            )}
          </Button>

          {image && (
            <Button
              variant="outline"
              size="sm"
              disabled={uploading || deleting}
              onClick={handleDeleteImage}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          )}

          <input
            id={`file-input-${clientId}`}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}

      {editable && !isAdmin && !image && (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => document.getElementById(`file-input-${clientId}`)?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Subir foto
          </Button>

          <input
            id={`file-input-${clientId}`}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      )}
    </div>
  );
}
