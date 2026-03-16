'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface GPSCheckInProps {
  clientId: string;
}

export function GPSCheckIn({ clientId }: GPSCheckInProps) {
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  const handleCheckIn = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no soportada en este navegador');
      return;
    }

    setLoading(true);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const response = await fetch('/api/collections/check-in', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              clientId,
              latitude,
              longitude,
              outcome: 'CHECK_IN',
              notes: 'Check-in rápido desde dispositivo móvil'
            }),
          });

          if (response.ok) {
            toast.success('Check-in registrado correctamente');
            setCheckedIn(true);
            setTimeout(() => setCheckedIn(false), 5000);
          } else {
            throw new Error('Error al registrar check-in');
          }
        } catch (error) {
          console.error('Check-in error:', error);
          toast.error('No se pudo registrar la visita');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        setLoading(false);
        console.error('GPS error:', error);
        toast.error('Error al obtener ubicación. Asegúrate de dar permisos de GPS.');
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <Button 
      variant={checkedIn ? "outline" : "default"}
      className={`${checkedIn ? 'border-green-500 text-green-600' : ''} w-full`}
      onClick={handleCheckIn}
      disabled={loading || checkedIn}
    >
      {loading ? (
        <Loader2 className="h-4 w-4 animate-spin mr-2" />
      ) : checkedIn ? (
        <CheckCircle2 className="h-4 w-4 mr-2" />
      ) : (
        <MapPin className="h-4 w-4 mr-2" />
      )}
      {loading ? 'Obteniendo ubicación...' : checkedIn ? 'Visita Registrada' : 'Registrar Visita GPS'}
    </Button>
  );
}
