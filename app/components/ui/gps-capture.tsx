
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Navigation, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface GPSCaptureProps {
  label?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  onLocationCapture: (lat: number, lng: number) => void;
  className?: string;
}

export function GPSCapture({ 
  label = "Ubicación GPS", 
  latitude, 
  longitude, 
  onLocationCapture,
  className = "" 
}: GPSCaptureProps) {
  const [isCapturing, setIsCapturing] = useState(false);

  const captureLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no soporta geolocalización");
      return;
    }

    setIsCapturing(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        onLocationCapture(latitude, longitude);
        setIsCapturing(false);
        toast.success("Ubicación capturada con éxito");
      },
      (error) => {
        console.error("Error capturando ubicación:", error);
        let msg = "Error al obtener ubicación";
        if (error.code === 1) msg = "Permiso de ubicación denegado";
        else if (error.code === 2) msg = "Ubicación no disponible";
        else if (error.code === 3) msg = "Tiempo de espera agotado";
        
        toast.error(msg);
        setIsCapturing(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const hasLocation = latitude !== null && longitude !== null && latitude !== '' && longitude !== '';

  return (
    <div className={`space-y-3 p-4 bg-gray-50 dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-gray-800 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
          <MapPin className="h-3 w-3" />
          {label}
        </Label>
        {hasLocation && (
          <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
            <CheckCircle2 className="h-3 w-3" />
            Capturada
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="relative">
          <Input
            placeholder="Latitud"
            value={latitude?.toString() || ''}
            readOnly
            className="h-9 text-xs font-mono bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 rounded-xl"
          />
        </div>
        <div className="relative">
          <Input
            placeholder="Longitud"
            value={longitude?.toString() || ''}
            readOnly
            className="h-9 text-xs font-mono bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 rounded-xl"
          />
        </div>
      </div>

      <Button
        type="button"
        variant={hasLocation ? "outline" : "default"}
        size="sm"
        className="w-full h-9 rounded-xl font-bold text-xs uppercase transition-all active:scale-[0.98]"
        onClick={captureLocation}
        disabled={isCapturing}
      >
        {isCapturing ? (
          <>
            <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
            Obteniendo...
          </>
        ) : (
          <>
            <Navigation className="h-3.5 w-3.5 mr-2" />
            {hasLocation ? "Actualizar Ubicación" : "Capturar Ubicación Actual"}
          </>
        )}
      </Button>
      
      {hasLocation && (
        <a 
          href={`https://www.google.com/maps?q=${latitude},${longitude}`} 
          target="_blank" 
          rel="noopener noreferrer"
          className="block text-center text-[10px] font-bold text-primary hover:underline uppercase mt-1"
        >
          Ver en Google Maps
        </a>
      )}
    </div>
  );
}
