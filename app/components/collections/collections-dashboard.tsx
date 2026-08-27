'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  MapPin,
  Calendar,
  User,
  Navigation,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  TrendingUp,
  DollarSign,
  Smartphone,
  Eye,
  RefreshCw,
  Search,
  Filter,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import AIRouteGeneratorModal from './ai-route-generator-modal';
import AdvisorTodayRoute from './advisor-today-route';

export default function CollectionsDashboard() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [candidatesSummary, setCandidatesSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCandidates, setIsLoadingCandidates] = useState(false);

  // Modales
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [selectedRouteDetail, setSelectedRouteDetail] = useState<any | null>(null);

  // Filtro de candidatos
  const [searchCandidate, setSearchCandidate] = useState('');

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [rRes, sRes] = await Promise.all([
        fetch('/api/collections/routes'),
        fetch('/api/collections/summary?period=month'),
      ]);
      const rData = await rRes.json();
      const sData = await sRes.json();
      setRoutes(rData.routes || []);
      setSummary(sData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las rutas de cobranza',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCandidates = async () => {
    try {
      setIsLoadingCandidates(true);
      const res = await fetch('/api/collections/predictive-candidates?maxCandidates=50');
      if (res.ok) {
        const data = await res.json();
        setCandidates(data.candidates || []);
        setCandidatesSummary(data.summary || null);
      }
    } catch (e) {
      console.error('Error fetching candidates:', e);
    } finally {
      setIsLoadingCandidates(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">Completada</Badge>;
      case 'IN_PROGRESS':
        return <Badge className="bg-blue-500 text-white hover:bg-blue-600 animate-pulse">En Progreso</Badge>;
      case 'CANCELLED':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  const filteredCandidates = candidates.filter(
    (c) =>
      c.clientName.toLowerCase().includes(searchCandidate.toLowerCase()) ||
      c.address.toLowerCase().includes(searchCandidate.toLowerCase()) ||
      c.phone.includes(searchCandidate)
  );

  return (
    <div className="space-y-6">
      {/* Header con Título y Botón Principal */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Centro de Cobranza Inteligente
            </h2>
            <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200">
              <Sparkles className="h-3 w-3 mr-1" /> IA Predictiva
            </Badge>
          </div>
          <p className="text-muted-foreground text-sm mt-1">
            Optimización geo-espacial con análisis de ventanas óptimas de pago y scoring de recuperación.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={fetchData} className="gap-1 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Actualizar
          </Button>

          <Button
            onClick={() => setIsAIModalOpen(true)}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 shadow-md transition-all duration-200"
          >
            <Sparkles className="h-4 w-4" />
            Generar Ruta con IA
          </Button>
        </div>
      </div>

      {/* Tarjetas de Métricas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-primary shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Visitas del Mes
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{summary?.totalVisits || 0}</div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {summary?.completedVisits || 0} visitas ejecutadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Efectividad de Cobro
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{summary?.visitCompletionRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tasa de visitas completadas vs programadas
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Promesas Recibidas
              <DollarSign className="h-4 w-4 text-indigo-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">
              ${(summary?.totalPromised || 0).toLocaleString('es-MX')}
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
              {summary?.totalPromises || 0} acuerdos de pago registrados
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500 shadow-sm hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-semibold text-muted-foreground uppercase flex items-center justify-between">
              Rutas Activas
              <Navigation className="h-4 w-4 text-purple-500" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-black text-foreground">{summary?.totalRoutes || routes.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {routes.filter((r) => r.status === 'IN_PROGRESS').length} en campo ahora mismo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pestañas Principales */}
      <Tabs defaultValue="routes" className="w-full space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-md bg-muted/60 p-1">
          <TabsTrigger value="routes" className="font-semibold text-xs sm:text-sm">
            Rutas de Cobranza
          </TabsTrigger>
          <TabsTrigger
            value="opportunities"
            onClick={fetchCandidates}
            className="font-semibold text-xs sm:text-sm flex items-center gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5 text-indigo-500" /> Oportunidades IA
          </TabsTrigger>
          <TabsTrigger value="advisor-view" className="font-semibold text-xs sm:text-sm flex items-center gap-1.5">
            <Smartphone className="h-3.5 w-3.5 text-primary" /> Mi Ruta de Hoy
          </TabsTrigger>
        </TabsList>

        {/* Pestaña 1: Rutas de Cobranza */}
        <TabsContent value="routes" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">Monitoreo de Rutas de Cobranza</CardTitle>
                  <CardDescription>
                    Rutas programadas, distancia estimada y avance de visitas por asesor.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Ruta / Asesor</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Visitas</TableHead>
                      <TableHead>Distancia / Duración</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          Cargando rutas de cobranza...
                        </TableCell>
                      </TableRow>
                    ) : routes.length > 0 ? (
                      routes.map((route) => {
                        const completedCount = route.visits.filter((v: any) => v.outcome).length;
                        const percent = route.visits.length > 0 ? Math.round((completedCount / route.visits.length) * 100) : 0;

                        return (
                          <TableRow key={route.id} className="hover:bg-muted/30 transition-colors">
                            <TableCell>
                              <div className="font-semibold text-foreground">{route.name}</div>
                              <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <User className="h-3 w-3" />
                                {route.advisor?.firstName} {route.advisor?.lastName}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(route.date).toLocaleDateString('es-MX', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="text-xs font-semibold">
                                {completedCount}/{route.visits.length} completadas
                              </div>
                              <div className="w-24 bg-muted rounded-full h-1.5 mt-1 overflow-hidden">
                                <div
                                  className="bg-primary h-1.5 rounded-full"
                                  style={{ width: `${percent}%` }}
                                />
                              </div>
                            </TableCell>
                            <TableCell className="text-xs text-muted-foreground">
                              <div>{(route.distance / 1000).toFixed(1)} km</div>
                              <div>~{Math.round(route.duration / 60)} min</div>
                            </TableCell>
                            <TableCell>
                              {route.optimized ? (
                                <Badge variant="outline" className="text-[10px] bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200">
                                  <Sparkles className="h-2.5 w-2.5 mr-0.5" /> IA TSP
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">
                                  Estándar
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell>{getStatusBadge(route.status)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedRouteDetail(route)}
                                className="gap-1 text-xs"
                              >
                                <Eye className="h-3.5 w-3.5" />
                                Ver Itinerario
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                          No hay rutas de cobranza registradas. Haz clic en "Generar Ruta con IA" para comenzar.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña 2: Oportunidades IA & Scoring */}
        <TabsContent value="opportunities" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-indigo-500" />
                    Cartera en Mora Priorizada por IA
                  </CardTitle>
                  <CardDescription>
                    Scoring de recuperación (0-100%) y ventana horaria recomendada según historial de transacciones.
                  </CardDescription>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-64">
                  <div className="relative w-full">
                    <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                    <Input
                      placeholder="Buscar cliente..."
                      value={searchCandidate}
                      onChange={(e) => setSearchCandidate(e.target.value)}
                      className="pl-8 text-xs h-9"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {candidatesSummary && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4 p-3 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 text-xs">
                  <div>
                    <span className="text-muted-foreground">Total Deuda Analizada:</span>{' '}
                    <strong className="text-foreground">${candidatesSummary.totalDebt.toLocaleString('es-MX')} MXN</strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Recuperación Estimada IA:</span>{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400">
                      ${candidatesSummary.totalExpectedRecovery.toLocaleString('es-MX')} MXN
                    </strong>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Score Promedio de Cobro:</span>{' '}
                    <strong className="text-indigo-600 dark:text-indigo-400">{candidatesSummary.averageRecoveryScore}%</strong>
                  </div>
                </div>
              )}

              <div className="rounded-md border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40">
                      <TableHead>Cliente / Préstamo</TableHead>
                      <TableHead>Mora / Cuotas</TableHead>
                      <TableHead>Monto Vencido</TableHead>
                      <TableHead>Ventana Óptima Sugerida</TableHead>
                      <TableHead>Score de Recuperación</TableHead>
                      <TableHead className="text-right">Acción</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCandidates ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          Analizando patrones históricos y scoring de cartera...
                        </TableCell>
                      </TableRow>
                    ) : filteredCandidates.length > 0 ? (
                      filteredCandidates.map((cand) => (
                        <TableRow key={cand.clientId} className="hover:bg-muted/30">
                          <TableCell>
                            <div className="font-semibold text-foreground">{cand.clientName}</div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <span>{cand.phone}</span> · <span className="font-mono text-primary">{cand.loanNumber}</span>
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate max-w-xs mt-0.5">
                              {cand.address}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs font-semibold bg-amber-50 text-amber-800 border-amber-200">
                              {cand.daysOverdue} días mora
                            </Badge>
                            <div className="text-xs text-muted-foreground mt-1">
                              {cand.unpaidInstallments} cuota(s) vencida(s)
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-bold text-foreground">
                              ${cand.amountDue.toLocaleString('es-MX')}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              Saldo: ${cand.totalLoanBalance.toLocaleString('es-MX')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border-indigo-200 text-xs">
                              {cand.contactWindow.label}
                            </Badge>
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              Sugerido: {cand.contactWindow.suggestedTime} ({cand.contactWindow.confidence}% conf.)
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Badge
                                className={
                                  cand.scoring.score >= 75
                                    ? 'bg-emerald-500 text-white'
                                    : cand.scoring.score >= 50
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-amber-500 text-white'
                                }
                              >
                                {cand.scoring.score}% ({cand.scoring.level})
                              </Badge>
                            </div>
                            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                              Est. ${cand.scoring.estimatedRecoveryAmount.toLocaleString('es-MX')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setIsAIModalOpen(true)}
                              className="text-xs gap-1 border-indigo-300 hover:bg-indigo-50"
                            >
                              <Plus className="h-3.5 w-3.5 text-indigo-500" />
                              Ruta IA
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                          {candidates.length === 0
                            ? 'No se detectaron clientes con mora activa en este momento.'
                            : 'No hay clientes que coincidan con la búsqueda.'}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pestaña 3: Vista Asesor / Mi Ruta de Hoy */}
        <TabsContent value="advisor-view" className="space-y-4">
          <AdvisorTodayRoute />
        </TabsContent>
      </Tabs>

      {/* Modal Generador con IA */}
      <AIRouteGeneratorModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        onSuccess={() => {
          fetchData();
          fetchCandidates();
        }}
      />

      {/* Modal / Detalle de Itinerario de Ruta */}
      <Dialog open={!!selectedRouteDetail} onOpenChange={(open) => !open && setSelectedRouteDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold text-lg">
              <Navigation className="h-5 w-5 text-primary" />
              Itinerario Detallado: {selectedRouteDetail?.name}
            </DialogTitle>
            <DialogDescription>
              Asignada a {selectedRouteDetail?.advisor?.firstName} {selectedRouteDetail?.advisor?.lastName} ·{' '}
              {selectedRouteDetail?.visits?.length || 0} visitas programadas
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {selectedRouteDetail?.visits?.map((visit: any, index: number) => {
              const isDone = !!visit.outcome;

              return (
                <div
                  key={visit.id}
                  className="flex items-center justify-between gap-3 p-3 rounded-lg border bg-muted/20 hover:bg-muted/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex flex-col items-center justify-center h-9 w-9 rounded-full text-xs font-bold ${
                        isDone ? 'bg-emerald-500/10 text-emerald-600' : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-4 w-4" /> : `#${index + 1}`}
                    </div>
                    <div>
                      <div className="font-semibold text-sm text-foreground">
                        {visit.client?.firstName} {visit.client?.lastName}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="truncate max-w-[260px]">{visit.address || visit.client?.address}</span>
                      </div>
                      {visit.notes && (
                        <div className="text-[10px] text-muted-foreground mt-0.5 italic">
                          {visit.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    {isDone ? (
                      <Badge className="bg-emerald-500 text-white text-[10px]">
                        {visit.outcome}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px]">
                        Pendiente
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
