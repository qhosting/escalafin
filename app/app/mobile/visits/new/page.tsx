'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin, Loader2, Camera, CheckCircle2, Image as ImageIcon, X } from 'lucide-react';
import { toast } from 'sonner';

/**
 * /mobile/visits/new — Enhanced with Capacitor Camera and Geolocation plugins
 * Falls back to browser FileInput and navigator.geolocation when running in PWA.
 */
export default function NewVisitPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);
  const [clients, setClients] = useState<any[]>([]);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [isCapacitor, setIsCapacitor] = useState(false);

  const [formData, setFormData] = useState({
    clientId: '',
    notes: '',
    outcome: 'visited',
    address: ''
  });

  useEffect(() => {
    const runningInCapacitor = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();
    setIsCapacitor(runningInCapacitor);

    fetch('/api/clients?limit=100')
      .then(res => res.json())
      .then(data => setClients(data.clients || []));

    getLocation();
  }, []);

  const getLocation = async () => {
    setGettingLocation(true);
    try {
      const runningInCapacitor = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();

      if (runningInCapacitor) {
        const cap = (window as any).Capacitor;
        const pos = await cap.Plugins.Geolocation.getCurrentPosition({ enableHighAccuracy: true });
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        toast.success('Ubicación GPS obtenida');
      } else if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            toast.success('Ubicación obtenida');
          },
          (err) => {
            toast.error('Error obteniendo ubicación');
            console.error(err);
          }
        );
      }
    } catch (e) {
      toast.error('GPS no disponible');
    } finally {
      setGettingLocation(false);
    }
  };

  const capturePhoto = async () => {
    try {
      const runningInCapacitor = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform?.();

      if (runningInCapacitor) {
        // Native Capacitor Camera via Plugins bridge
        const cap = (window as any).Capacitor;
        const photo = await cap.Plugins.Camera.getPhoto({
          resultType: 'dataUrl',
          source: 'CAMERA',
          quality: 80,
          correctOrientation: true,
        });
        if (photo.dataUrl) {
          setPhotoUri(photo.dataUrl);
          toast.success('Foto capturada');
        }
      } else {
        // Browser fallback — click a hidden file input
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.capture = 'environment';
        input.onchange = (e: any) => {
          const file = e.target.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              if (ev.target?.result) setPhotoUri(ev.target.result as string);
            };
            reader.readAsDataURL(file);
          }
        };
        input.click();
      }
    } catch (e: any) {
      if (!e.message?.includes('cancelled')) {
        toast.error('Error al capturar foto');
      }
    }
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
          longitude: location?.lng,
          evidencePhotoBase64: photoUri,
          visitDate: new Date().toISOString(),
        })
      });

      if (response.ok) {
        toast.success('¡Visita registrada con éxito!');
        router.push('/mobile/visits');
      } else {
        const err = await response.json();
        toast.error(err.error || 'Error al registrar visita');
      }
    } catch (error) {
      toast.error('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 pb-24">
      <Card className="rounded-2xl shadow-sm border-0">
        <CardHeader className="px-5 pt-5 pb-3">
          <CardTitle className="text-lg font-black text-slate-900 dark:text-white">Registrar Visita</CardTitle>
          <p className="text-xs text-slate-400 font-medium">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</p>
        </CardHeader>
        <CardContent className="px-5 pb-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Client selector */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Cliente</Label>
              <Select value={formData.clientId} onValueChange={val => setFormData({ ...formData, clientId: val })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map(c => (
                    <SelectItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Outcome */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Resultado de la Visita</Label>
              <Select value={formData.outcome} onValueChange={val => setFormData({ ...formData, outcome: val })}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="visited">✅ Visita Realizada</SelectItem>
                  <SelectItem value="paid">💰 Pago Recibido en Visita</SelectItem>
                  <SelectItem value="promise">🤝 Promesa de Pago</SelectItem>
                  <SelectItem value="not_found">❌ Cliente No Localizado</SelectItem>
                  <SelectItem value="refused">🚫 Se Negó a Pagar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-600">Notas / Observaciones</Label>
              <Textarea
                className="rounded-xl text-sm"
                rows={3}
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Detalles de la visita, compromisos, condiciones del domicilio..."
              />
            </div>

            {/* Evidence Photo */}
            <div className="space-y-2">
              <Label className="text-xs font-bold text-slate-600">Foto de Evidencia</Label>
              {photoUri ? (
                <div className="relative rounded-xl overflow-hidden border-2 border-emerald-300">
                  <img src={photoUri} alt="Evidencia" className="w-full h-36 object-cover" />
                  <button
                    type="button"
                    onClick={() => setPhotoUri(null)}
                    className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                  <div className="absolute bottom-2 left-2 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Foto capturada
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-full h-24 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-slate-900 active:scale-98 transition-transform"
                >
                  <Camera className="h-7 w-7 text-slate-400" />
                  <span className="text-xs text-slate-400 font-medium">
                    {isCapacitor ? 'Tomar foto con cámara nativa' : 'Tomar foto de evidencia'}
                  </span>
                </button>
              )}
            </div>

            {/* GPS Location */}
            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${location ? 'bg-emerald-500' : 'bg-slate-300'} ${location ? 'animate-pulse' : ''}`} />
                <div>
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {location ? 'GPS Registrado' : 'Sin ubicación GPS'}
                  </p>
                  {location && (
                    <p className="text-[10px] text-slate-400 font-mono">
                      {location.lat.toFixed(6)}, {location.lng.toFixed(6)}
                    </p>
                  )}
                </div>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={getLocation} disabled={gettingLocation} className="rounded-xl text-xs font-bold">
                {gettingLocation ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MapPin className="h-3.5 w-3.5" />}
                {gettingLocation ? 'Buscando...' : 'GPS'}
              </Button>
            </div>

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl h-12 text-sm" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
              Guardar Visita
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
