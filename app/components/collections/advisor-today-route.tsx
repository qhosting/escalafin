'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Navigation,
  MapPin,
  Phone,
  MessageSquare,
  CheckCircle2,
  Clock,
  DollarSign,
  AlertCircle,
  Sparkles,
  Calendar,
  Camera,
  Loader2,
  RefreshCw,
} from 'lucide-react';

export default function AdvisorTodayRoute() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal Check-in / Resultado
  const [activeVisit, setActiveVisit] = useState<any | null>(null);
  const [outcome, setOutcome] = useState<string>('PAGO_COMPLETO');
  const [outcomeNotes, setOutcomeNotes] = useState<string>('');
  const [promiseDate, setPromiseDate] = useState<string>('');
  const [promiseAmount, setPromiseAmount] = useState<string>('');
  const [isSubmittingCheckin, setIsSubmittingCheckin] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchTodayRoutes();
  }, []);

  const fetchTodayRoutes = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/collections/routes');
      if (res.ok) {
        const data = await res.json();
        const routeList = data.routes || [];
        setRoutes(routeList);
        if (routeList.length > 0) {
          setSelectedRoute(routeList[0]);
        }
      }
    } catch (e) {
      console.error('Error fetching today routes:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenCheckin = (visit: any) => {
    setActiveVisit(visit);
    setOutcome(visit.outcome || 'PAGO_RECIBIDO');
    setOutcomeNotes('');
    setPromiseDate('');
    setPromiseAmount('');
  };

  const handleSubmitCheckin = async () => {
    if (!activeVisit) return;

    try {
      setIsSubmittingCheckin(true);

      // Obtener coordenadas GPS del dispositivo si están disponibles
      let latitude: number | null = null;
      let longitude: number | null = null;

      if (navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 6000,
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (geoErr) {
          console.warn('No se pudo obtener GPS en vivo:', geoErr);
        }
      }

      const res = await fetch(`/api/collections/visits/${activeVisit.id}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          outcome,
          notes: outcomeNotes,
          latitude,
          longitude,
          promiseDate: promiseDate ? new Date(promiseDate) : undefined,
          promiseAmount: promiseAmount ? parseFloat(promiseAmount) : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al registrar check-in');

      toast({
        title: '¡Visita Registrada!',
        description: `Resultado guardado para ${activeVisit.client?.firstName}.`,
      });

      setActiveVisit(null);
      fetchTodayRoutes();
    } catch (error: any) {
      toast({
        title: 'Error de registro',
        description: error.message || 'No se pudo guardar la visita.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingCheckin(false);
    }
  };

  const openNavigation = (visit: any) => {
    if (visit.latitude && visit.longitude) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${visit.latitude},${visit.longitude}`,
        '_blank'
      );
    } else {
      const addressQuery = encodeURIComponent(visit.address || visit.client?.address || '');
      window.open(`https://www.google.com/maps/search/?api=1&query=${addressQuery}`, '_blank');
    }
  };

  const openWhatsApp = (visit: any) => {
    const phone = (visit.client?.phone || '').replace(/\D/g, '');
    const name = visit.client?.firstName || 'Estimado(a) Cliente';
    const message = encodeURIComponent(
      `Hola ${name}, le saluda su asesor de EscalaFin. Me encuentro en ruta para visitarle hoy conforme a su préstamo. ¿Se encuentra en su domicilio? Quedo a sus órdenes.`
    );
    window.open(`https://wa.me/${phone.startsWith('52') ? phone : '52' + phone}?text=${message}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
        <p>Cargando itinerario y rutas del día...</p>
      </div>
    );
  }

  if (routes.length === 0) {
    return (
      <div className="p-8 text-center border rounded-xl bg-card">
        <MapPin className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <h3 className="font-semibold text-lg">Sin Rutas Asignadas para Hoy</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Usa el botón "Generar Ruta con IA" en la barra superior para optimizar tu día de cobranza.
        </p>
      </div>
    );
  }

  const visits = selectedRoute?.visits || [];
  const completedVisits = visits.filter((v: any) => v.outcome).length;
  const progressPercent = visits.length > 0 ? Math.round((completedVisits / visits.length) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Selector de Ruta y Resumen */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 rounded-xl border">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-foreground">{selectedRoute?.name || 'Ruta del Día'}</h3>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
              {visits.length} paradas
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Fecha: {new Date(selectedRoute?.date).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:w-48">
            <div className="flex justify-between text-xs font-semibold mb-1">
              <span>Progreso</span>
              <span className="text-primary">{completedVisits}/{visits.length} ({progressPercent}%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-primary h-2.5 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={fetchTodayRoutes} className="shrink-0 gap-1">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Tarjetas de Paradas / Visitas */}
      <div className="space-y-3">
        {visits.map((visit: any, index: number) => {
          const isDone = !!visit.outcome;

          return (
            <Card
              key={visit.id}
              className={`transition-all hover:shadow-md ${
                isDone ? 'bg-muted/40 border-muted opacity-85' : 'border-primary/20 shadow-sm'
              }`}
            >
              <CardContent className="p-4 sm:p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Info Principal */}
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex flex-col items-center justify-center h-11 w-11 rounded-full font-bold text-sm shrink-0 ${
                        isDone
                          ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : `#${index + 1}`}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-base text-foreground">
                          {visit.client?.firstName} {visit.client?.lastName}
                        </span>
                        {isDone ? (
                          <Badge className="bg-emerald-500 text-white text-[10px]">
                            {visit.outcome}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300 border-amber-200">
                            Pendiente
                          </Badge>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span>{visit.address || visit.client?.address || 'Sin dirección'}</span>
                      </div>

                      {visit.notes && (
                        <div className="text-[11px] text-indigo-700 dark:text-indigo-300 font-mono bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded inline-block mt-1">
                          {visit.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Acciones Rápidas */}
                  <div className="flex flex-wrap items-center gap-2 self-end sm:self-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openNavigation(visit)}
                      className="gap-1 text-xs"
                    >
                      <Navigation className="h-3.5 w-3.5 text-blue-500" />
                      Navegar
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openWhatsApp(visit)}
                      className="gap-1 text-xs text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:border-emerald-800 dark:hover:bg-emerald-950"
                    >
                      <MessageSquare className="h-3.5 w-3.5 text-emerald-500" />
                      WhatsApp
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => handleOpenCheckin(visit)}
                      className={`gap-1 text-xs ${
                        isDone ? 'bg-muted text-foreground hover:bg-muted/80' : 'bg-primary text-primary-foreground'
                      }`}
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      {isDone ? 'Editar Resultado' : 'Registrar Visita'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Modal Registrar Check-in / Resultado */}
      <Dialog open={!!activeVisit} onOpenChange={(open) => !open && setActiveVisit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Resultado de Visita: {activeVisit?.client?.firstName}
            </DialogTitle>
            <DialogDescription>
              Captura el resultado y la evidencia de la visita en campo con geolocalización GPS.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="text-xs font-semibold">Resultado de la Gestión</Label>
              <Select value={outcome} onValueChange={setOutcome}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PAGO_COMPLETO">💵 Pago Completo Recibido</SelectItem>
                  <SelectItem value="PAGO_PARCIAL">💵 Pago Parcial Recibido</SelectItem>
                  <SelectItem value="PROMESA_DE_PAGO">🤝 Promesa de Pago Firmada</SelectItem>
                  <SelectItem value="CLIENTE_AUSENTE">🚪 Cliente Ausente / No localizable</SelectItem>
                  <SelectItem value="RECHAZO_COBRO">⚠️ Negativa de Pago / Conflicto</SelectItem>
                  <SelectItem value="DOMICILIO_INCORRECTO">📍 Domicilio Incorrecto o Deshabitado</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Campos condicionales para promesa */}
            {outcome === 'PROMESA_DE_PAGO' && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-amber-900 dark:text-amber-200">Fecha Promesa</Label>
                  <Input
                    type="date"
                    value={promiseDate}
                    onChange={(e) => setPromiseDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-amber-900 dark:text-amber-200">Monto Prometido</Label>
                  <Input
                    type="number"
                    placeholder="Monto MXN"
                    value={promiseAmount}
                    onChange={(e) => setPromiseAmount(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs font-semibold">Notas y Observaciones de Campo</Label>
              <Textarea
                placeholder="Ej. Se entrevistó con el cónyuge, acordó pagar el viernes por transferencia..."
                value={outcomeNotes}
                onChange={(e) => setOutcomeNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setActiveVisit(null)} disabled={isSubmittingCheckin}>
              Cancelar
            </Button>
            <Button onClick={handleSubmitCheckin} disabled={isSubmittingCheckin} className="gap-2">
              {isSubmittingCheckin ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Guardando GPS...
                </>
              ) : (
                'Guardar Registro'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
