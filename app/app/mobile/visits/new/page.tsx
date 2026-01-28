
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';

export default function NewVisitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [clients, setClients] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    clientId: '',
    notes: '',
    outcome: 'visited',
    address: ''
  });

  useEffect(() => {
    // Cargar clientes asignados
    fetch('/api/clients?limit=100')
      .then(res => res.json())
      .then(data => setClients(data.clients || []));

    // Obtener ubicación al iniciar
    getLocation();
  }, []);

  const getLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no soportada');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setGettingLocation(false);
        toast.success('Ubicación obtenida');
      },
      (error) => {
        console.error('Error getting location:', error);
        toast.error('Error obteniendo ubicación');
        setGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      toast.error('Selecciona un cliente');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/mobile/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          latitude: location?.lat,
          longitude: location?.lng
        })
      });

      if (response.ok) {
        toast.success('Visita registrada');
        router.push('/mobile/visits');
      } else {
        toast.error('Error al registrar visita');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Visita</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <Select
                value={formData.clientId}
                onValueChange={(val) => setFormData({...formData, clientId: val})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Resultado</Label>
              <Select
                value={formData.outcome}
                onValueChange={(val) => setFormData({...formData, outcome: val})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visited">Visita Realizada</SelectItem>
                  <SelectItem value="paid">Pago Recibido</SelectItem>
                  <SelectItem value="promise">Promesa de Pago</SelectItem>
                  <SelectItem value="not_found">No Encontrado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Observaciones de la visita..."
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-gray-500" />
                <span className="text-sm">
                  {location ? `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}` : 'Sin ubicación'}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={getLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Actualizar'}
              </Button>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Guardar Visita
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
