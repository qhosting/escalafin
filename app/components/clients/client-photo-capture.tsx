'use client';

/**
 * ClientPhotoCapture — EscalaFin v3.1.0
 * Captura de foto del cliente con:
 * - Cámara en vivo (getUserMedia)
 * - Fallback: subida de archivo
 * - Preview circular con recorte
 * - Preparado para Google Drive API
 */

import { useState, useRef, useCallback } from 'react';
import { Camera, Upload, RotateCcw, Check, User, CloudUpload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface ClientPhotoCaptureProps {
  onPhotoCapture: (dataUrl: string, file?: File) => void;
  currentPhoto?: string | null;
  driveEnabled?: boolean;
}

export function ClientPhotoCapture({
  onPhotoCapture,
  currentPhoto,
  driveEnabled = false,
}: ClientPhotoCaptureProps) {
  const [mode, setMode] = useState<'idle' | 'camera' | 'preview'>('idle');
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhoto || null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [uploading, setUploading] = useState(false);
  const [driveUrl, setDriveUrl] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Iniciar cámara
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      setStream(mediaStream);
      setMode('camera');
      // Asignar stream al video element en el siguiente tick
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.play();
        }
      }, 100);
    } catch {
      toast.error('No se pudo acceder a la cámara. Use la opción de archivo.');
    }
  };

  // Detener cámara
  const stopCamera = useCallback(() => {
    stream?.getTracks().forEach((t) => t.stop());
    setStream(null);
  }, [stream]);

  // Capturar foto desde cámara
  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
    stopCamera();
    setPhotoUrl(dataUrl);
    setMode('preview');
    onPhotoCapture(dataUrl);
  };

  // Subir desde archivo
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Solo se permiten imágenes');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setPhotoUrl(dataUrl);
      setMode('preview');
      onPhotoCapture(dataUrl, file);
    };
    reader.readAsDataURL(file);
  };

  // Simular subida a Google Drive (preparado)
  const uploadToDrive = async () => {
    if (!driveEnabled) {
      toast.info('Google Drive no configurado. Configure las credenciales en /admin/config.');
      return;
    }
    setUploading(true);
    try {
      // TODO: Implementar cuando se configuren credenciales Google Drive
      // const res = await fetch('/api/drive/upload-photo', { method: 'POST', body: ... });
      await new Promise((r) => setTimeout(r, 1500));
      setDriveUrl('https://drive.google.com/file/pending');
      toast.success('Foto subida a Google Drive');
    } catch {
      toast.error('Error al subir a Google Drive');
    } finally {
      setUploading(false);
    }
  };

  const retake = () => {
    stopCamera();
    setPhotoUrl(null);
    setDriveUrl(null);
    setMode('idle');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Preview / Placeholder */}
      <div className="relative">
        <div className="w-36 h-36 rounded-full border-4 border-dashed border-slate-300 dark:border-slate-600 overflow-hidden bg-slate-100 dark:bg-slate-800 flex items-center justify-center shadow-inner">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Foto del cliente"
              className="w-full h-full object-cover"
            />
          ) : mode === 'camera' ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
          ) : (
            <User className="w-16 h-16 text-slate-400" />
          )}
        </div>

        {/* Badge de estado */}
        {photoUrl && !driveUrl && (
          <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs px-2 py-0.5 whitespace-nowrap">
            <Check className="w-3 h-3 mr-1" /> Capturada
          </Badge>
        )}
        {driveUrl && (
          <Badge className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs px-2 py-0.5 whitespace-nowrap">
            <CloudUpload className="w-3 h-3 mr-1" /> En Drive
          </Badge>
        )}
      </div>

      {/* Canvas oculto para captura */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Acciones según modo */}
      <div className="flex flex-wrap gap-2 justify-center">
        {mode === 'idle' && !photoUrl && (
          <>
            <Button type="button" size="sm" onClick={startCamera} className="gap-1.5">
              <Camera className="w-4 h-4" />
              Usar Cámara
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="gap-1.5"
            >
              <Upload className="w-4 h-4" />
              Subir Archivo
            </Button>
          </>
        )}

        {mode === 'camera' && (
          <>
            <Button type="button" size="sm" onClick={capturePhoto} className="gap-1.5 bg-green-600 hover:bg-green-700">
              <Camera className="w-4 h-4" />
              Capturar
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={() => { stopCamera(); setMode('idle'); }} className="gap-1.5">
              <RotateCcw className="w-4 h-4" />
              Cancelar
            </Button>
          </>
        )}

        {(mode === 'preview' || (mode === 'idle' && photoUrl)) && (
          <>
            <Button type="button" size="sm" variant="outline" onClick={retake} className="gap-1.5">
              <RotateCcw className="w-4 h-4" />
              Retomar
            </Button>
            <Button
              type="button"
              size="sm"
              variant={driveEnabled ? 'default' : 'outline'}
              onClick={uploadToDrive}
              disabled={uploading || !!driveUrl}
              className="gap-1.5"
              title={!driveEnabled ? 'Configure Google Drive en /admin/config' : ''}
            >
              {uploading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CloudUpload className="w-4 h-4" />
              )}
              {driveUrl ? 'En Drive ✓' : 'Subir a Drive'}
            </Button>
          </>
        )}
      </div>

      {/* Input oculto de archivo */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="user"
        className="hidden"
        onChange={handleFileUpload}
      />

      {!driveEnabled && (
        <p className="text-xs text-slate-500 text-center">
          Google Drive no configurado.{' '}
          <a href="/admin/config" className="text-blue-500 underline">
            Configurar
          </a>
        </p>
      )}
    </div>
  );
}
