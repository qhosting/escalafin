'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  Sparkles,
  MapPin,
  Clock,
  TrendingUp,
  DollarSign,
  Calendar,
  UserCheck,
  CheckCircle2,
  Navigation,
  Loader2,
  AlertTriangle,
} from 'lucide-react';

interface AIRouteGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AIRouteGeneratorModal({
  isOpen,
  onClose,
  onSuccess,
}: AIRouteGeneratorModalProps) {
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [selectedAdvisorId, setSelectedAdvisorId] = useState<string>('');
  const [routeName, setRouteName] = useState<string>('');
  const [routeDate, setRouteDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>('08:30');
  const [maxVisits, setMaxVisits] = useState<number>(10);
  const [minScore, setMinScore] = useState<number>(0);

  const [isLoadingAdvisors, setIsLoadingAdvisors] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewData, setPreviewData] = useState<any | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchAdvisors();
      setRouteName(`Ruta IA - ${new Date().toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' })}`);
      setPreviewData(null);
    }
  }, [isOpen]);

  const fetchAdvisors = async () => {
    try {
      setIsLoadingAdvisors(true);
      const res = await fetch('/api/users?role=ASESOR');
      if (res.ok) {
        const data = await res.json();
        const advisorList = Array.isArray(data) ? data : data.users || [];
        setAdvisors(advisorList);
        if (advisorList.length > 0 && !selectedAdvisorId) {
          setSelectedAdvisorId(advisorList[0].id);
        }
      }
    } catch (e) {
      console.error('Error fetching advisors:', e);
    } finally {
      setIsLoadingAdvisors(false);
    }
  };

  const handleGeneratePreview = async () => {
    try {
      setIsPreviewing(true);
      const queryParams = new URLSearchParams({
        maxCandidates: maxVisits.toString(),
        minDaysOverdue: '1',
      });
      if (selectedAdvisorId) queryParams.set('advisorId', selectedAdvisorId);

      const res = await fetch(`/api/collections/predictive-candidates?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Error al consultar candidatos');

      const data = await res.json();
      const candidates = data.candidates || [];

      if (candidates.length === 0) {
        toast({
          title: 'Sin clientes morosos',
          description: 'No se encontraron clientes con pagos vencidos para los criterios seleccionados.',
        });
        setPreviewData(null);
        return;
      }

      // Calcular resumen proyectado
      let currentMin = 8 * 60 + 30;
      if (startTime) {
        const [h, m] = startTime.split(':').map(Number);
        if (!isNaN(h) && !isNaN(m)) currentMin = h * 60 + m;
      }

      const formatTime = (minutes: number) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        const period = h >= 12 ? 'PM' : 'AM';
        const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
        return `${displayH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${period}`;
      };

      const stops = candidates.slice(0, maxVisits).map((c: any, index: number) => {
        const start = formatTime(currentMin);
        currentMin += 25; // 20 min visita + 5 min traslado
        const end = formatTime(currentMin);

        return {
          order: index + 1,
          time: `${start} - ${end}`,
          clientName: c.clientName,
          address: c.address,
          phone: c.phone,
          amountDue: c.amountDue,
          score: c.scoring.score,
          level: c.scoring.level,
          windowLabel: c.contactWindow.label,
          suggestedTime: c.contactWindow.suggestedTime,
        };
      });

      const totalDebt = candidates.slice(0, maxVisits).reduce((s: number, c: any) => s + c.amountDue, 0);
      const totalExpected = candidates.slice(0, maxVisits).reduce((s: number, c: any) => s + c.scoring.estimatedRecoveryAmount, 0);
      const avgScore = Math.round(candidates.slice(0, maxVisits).reduce((s: number, c: any) => s + c.scoring.score, 0) / stops.length);

      setPreviewData({
        stops,
        totalVisits: stops.length,
        totalDebt,
        totalExpected,
        avgScore,
        estimatedDurationHours: (stops.length * 25 / 60).toFixed(1),
        estimatedDistanceKm: (stops.length * 1.8).toFixed(1),
      });

      toast({
        title: 'Optimización IA completada',
        description: `Se estructuró un itinerario de ${stops.length} paradas con alta probabilidad de cobro.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error de optimización',
        description: error.message || 'No se pudo generar la vista previa.',
        variant: 'destructive',
      });
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirmAndCreate = async () => {
    try {
      setIsGenerating(true);

      const res = await fetch('/api/collections/generate-ai-route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advisorId: selectedAdvisorId,
          name: routeName,
          date: routeDate,
          startTime,
          maxVisits,
          minRecoveryScore: minScore > 0 ? minScore : undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al crear ruta');

      toast({
        title: '¡Ruta IA Creada!',
        description: `Ruta "${routeName}" asignada con ${data.visits?.length || 0} visitas programadas.`,
      });

      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: 'Error al persistir ruta',
        description: error.message || 'Ocurrió un fallo en el servidor.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-6 w-6 animate-pulse text-indigo-500" />
            <DialogTitle className="text-xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
              Generador Asistido por IA de Rutas de Cobranza
            </DialogTitle>
          </div>
          <DialogDescription>
            Algoritmo predictivo que sincroniza horarios históricos de pago, score de recuperación y geolocalización.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Parámetros de Configuración */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 p-4 rounded-xl bg-muted/40 border">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Nombre de la Ruta</Label>
              <Input
                value={routeName}
                onChange={(e) => setRouteName(e.target.value)}
                placeholder="Ej. Ruta Matutina Norte"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Asesor / Cobrador</Label>
              <Select value={selectedAdvisorId} onValueChange={setSelectedAdvisorId}>
                <SelectTrigger>
                  <SelectValue placeholder={isLoadingAdvisors ? 'Cargando asesores...' : 'Seleccionar asesor'} />
                </SelectTrigger>
                <SelectContent>
                  {advisors.map((adv) => (
                    <SelectItem key={adv.id} value={adv.id}>
                      {adv.firstName} {adv.lastName}
                    </SelectItem>
                  ))}
                  {advisors.length === 0 && (
                    <SelectItem value="none" disabled>
                      Sin asesores registrados
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Fecha de Ejecución</Label>
              <Input
                type="date"
                value={routeDate}
                onChange={(e) => setRouteDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Hora de Salida</Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">
                Máximo de Visitas ({maxVisits})
              </Label>
              <Input
                type="number"
                min={3}
                max={30}
                value={maxVisits}
                onChange={(e) => setMaxVisits(parseInt(e.target.value, 10) || 10)}
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground uppercase">Filtro de Score IA</Label>
              <Select value={minScore.toString()} onValueChange={(val) => setMinScore(Number(val))}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos los clientes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Todos (Mayor cobertura)</SelectItem>
                  <SelectItem value="50">Score Medio (&gt;50%)</SelectItem>
                  <SelectItem value="75">Solo Alta Probabilidad (&gt;75%)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Botón de Previsualización */}
          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleGeneratePreview}
              disabled={isPreviewing}
              className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-950/50 shadow-sm"
            >
              {isPreviewing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Calculando Ventanas y Distancias...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-indigo-500" />
                  Calcular y Previsualizar Itinerario Óptimo
                </>
              )}
            </Button>
          </div>

          {/* Preview del Itinerario Optimizado */}
          {previewData && (
            <div className="space-y-4 rounded-xl border p-4 bg-card shadow-sm animate-in fade-in-50 duration-300">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b pb-3">
                <div>
                  <h4 className="font-semibold text-base flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    Itinerario Inteligente Sugerido ({previewData.totalVisits} paradas)
                  </h4>
                  <p className="text-xs text-muted-foreground">
                    Tiempo est. {previewData.estimatedDurationHours} hrs · ~{previewData.estimatedDistanceKm} km de recorrido total
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">Recuperación Proyectada</div>
                    <div className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                      ${previewData.totalExpected.toLocaleString('es-MX')} MXN
                    </div>
                  </div>
                  <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200">
                    Score Promedio: {previewData.avgScore}%
                  </Badge>
                </div>
              </div>

              {/* Lista de Paradas */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {previewData.stops.map((stop: any) => (
                  <div
                    key={stop.order}
                    className="flex items-center justify-between gap-3 p-3 rounded-lg bg-muted/30 border text-sm hover:bg-muted/60 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col items-center justify-center h-10 w-10 rounded-full bg-primary/10 text-primary font-bold text-xs">
                        #{stop.order}
                      </div>
                      <div>
                        <div className="font-semibold text-foreground flex items-center gap-2">
                          {stop.clientName}
                          <Badge variant="outline" className="text-[10px] py-0">
                            {stop.windowLabel}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate max-w-[280px]">{stop.address}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <div className="font-mono text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                          {stop.time}
                        </div>
                        <div className="text-xs font-semibold text-foreground">
                          ${stop.amountDue.toLocaleString('es-MX')}
                        </div>
                      </div>
                      <Badge
                        className={
                          stop.score >= 75
                            ? 'bg-emerald-500 text-white'
                            : stop.score >= 50
                            ? 'bg-blue-500 text-white'
                            : 'bg-amber-500 text-white'
                        }
                      >
                        {stop.score}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={isGenerating}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirmAndCreate}
            disabled={!previewData || isGenerating}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando Ruta y Visitas...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Confirmar y Asignar Ruta IA
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
