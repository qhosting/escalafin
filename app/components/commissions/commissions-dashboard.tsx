'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DollarSign,
  Percent,
  TrendingUp,
  Users,
  Wallet,
  Plus,
  CheckCircle2,
  Clock,
  Check,
  RefreshCw,
  Layers,
  Filter,
  FileSpreadsheet,
  Trash2,
  Edit,
  ShieldCheck,
  Briefcase
} from 'lucide-react';
import { toast } from 'sonner';
import { CommissionSchemaModal } from './commission-schema-modal';

export default function CommissionsDashboard() {
  const [activeTab, setActiveTab] = useState('records');
  const [records, setRecords] = useState<any[]>([]);
  const [schemas, setSchemas] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [advisors, setAdvisors] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Filtros
  const [statusFilter, setStatusFilter] = useState('all');
  const [advisorFilter, setAdvisorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Selección Múltiple (Batch Actions)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isProcessingAction, setIsProcessingAction] = useState(false);

  // Modal Esquemas
  const [isSchemaModalOpen, setIsSchemaModalOpen] = useState(false);
  const [schemaToEdit, setSchemaToEdit] = useState<any>(null);

  useEffect(() => {
    fetchData();
    fetchSchemas();
    fetchAdvisors();
  }, [statusFilter, advisorFilter, typeFilter]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const queryParams = new URLSearchParams();
      if (statusFilter !== 'all') queryParams.append('status', statusFilter);
      if (advisorFilter !== 'all') queryParams.append('advisorId', advisorFilter);
      if (typeFilter !== 'all') queryParams.append('type', typeFilter);

      const [rRes, sRes] = await Promise.all([
        fetch(`/api/commissions?${queryParams.toString()}`),
        fetch('/api/commissions/dashboard?period=month')
      ]);

      const rData = await rRes.json();
      const sData = await sRes.json();

      setRecords(rData.records || []);
      setSummary(sData);
    } catch (error) {
      console.error('Error fetching commission data:', error);
      toast.error('No se pudieron cargar las comisiones');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSchemas = async () => {
    try {
      const res = await fetch('/api/commissions/schemas');
      const data = await res.json();
      if (data.success) {
        setSchemas(data.schemas || []);
      }
    } catch (error) {
      console.error('Error fetching schemas:', error);
    }
  };

  const fetchAdvisors = async () => {
    try {
      const res = await fetch('/api/users?role=ASESOR');
      const data = await res.json();
      if (Array.isArray(data)) {
        setAdvisors(data);
      } else if (data.users) {
        setAdvisors(data.users);
      }
    } catch (error) {
      console.error('Error fetching advisors:', error);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(records.map(r => r.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(item => item !== id));
    }
  };

  const handleBatchAction = async (action: 'approve' | 'pay' | 'cancel') => {
    if (selectedIds.length === 0) {
      toast.error('Selecciona al menos una comisión');
      return;
    }

    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/commissions/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          commissionIds: selectedIds
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al ejecutar la acción');

      const actionText = action === 'approve' ? 'aprobadas' : action === 'pay' ? 'pagadas' : 'canceladas';
      toast.success(`${data.updatedCount || selectedIds.length} comisiones ${actionText} con éxito`);
      setSelectedIds([]);
      fetchData();
    } catch (error: any) {
      console.error('Error batch action:', error);
      toast.error(error.message || 'Error al procesar lote');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleSingleAction = async (id: string, action: 'approve' | 'pay') => {
    setIsProcessingAction(true);
    try {
      const res = await fetch('/api/commissions/actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          commissionIds: [id]
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al procesar');

      toast.success(action === 'approve' ? 'Comisión aprobada' : 'Comisión pagada');
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar');
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRecalculateCommissions = async () => {
    setIsRecalculating(true);
    try {
      const res = await fetch('/api/commissions/recalculate', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al recalcular');

      toast.success(`Recálculo completado: ${data.result?.originationCalculated || 0} originaciones y ${data.result?.collectionCalculated || 0} cobranzas generadas.`);
      fetchData();
    } catch (error: any) {
      toast.error(error.message || 'Error al recalcular comisiones');
    } finally {
      setIsRecalculating(false);
    }
  };

  const handleToggleSchemaStatus = async (schemaId: string, currentActive: boolean) => {
    try {
      const res = await fetch(`/api/commissions/schemas/${schemaId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !currentActive })
      });
      if (!res.ok) throw new Error('Error al cambiar estado');
      toast.success(currentActive ? 'Esquema desactivado' : 'Esquema activado');
      fetchSchemas();
    } catch (error: any) {
      toast.error(error.message || 'Error al actualizar esquema');
    }
  };

  const handleDeleteSchema = async (schemaId: string) => {
    if (!confirm('¿Está seguro de eliminar o desactivar este esquema?')) return;
    try {
      const res = await fetch(`/api/commissions/schemas/${schemaId}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Error al eliminar');
      toast.success('Esquema eliminado/desactivado');
      fetchSchemas();
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar esquema');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val || 0);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header General */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Wallet className="h-7 w-7 text-blue-600" />
            Gestión & Liquidación de Comisiones
          </h1>
          <p className="text-sm font-medium text-slate-500">
            Control de esquemas, cálculo automático por originación/cobranza y pago a asesores
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRecalculateCommissions}
            disabled={isRecalculating}
            className="rounded-xl border-slate-200 dark:border-slate-800 font-bold text-xs gap-2"
          >
            <RefreshCw className={`h-4 w-4 text-blue-600 ${isRecalculating ? 'animate-spin' : ''}`} />
            Recalcular Comisiones
          </Button>

          <Button
            onClick={() => {
              setSchemaToEdit(null);
              setIsSchemaModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs gap-2 shadow-md shadow-blue-500/20"
          >
            <Plus className="h-4 w-4" />
            Nuevo Esquema
          </Button>
        </div>
      </div>

      {/* Tarjetas de Resumen Global */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-amber-50/40 dark:bg-amber-950/20 border-amber-200/50">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 tracking-widest flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" /> Comisiones Pendientes
            </p>
            <p className="text-2xl font-black text-amber-700 dark:text-amber-300">
              {formatCurrency(summary?.pending?.amount || 0)}
            </p>
            <p className="text-xs font-semibold text-amber-600/80">
              {summary?.pending?.count || 0} registros por revisar
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/50">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 tracking-widest flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" /> Comisiones Aprobadas
            </p>
            <p className="text-2xl font-black text-blue-700 dark:text-blue-300">
              {formatCurrency(summary?.approved?.amount || 0)}
            </p>
            <p className="text-xs font-semibold text-blue-600/80">
              {summary?.approved?.count || 0} listos para liquidación
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200/50">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-widest flex items-center gap-1">
              <Wallet className="h-3.5 w-3.5" /> Pagadas (Mes Actual)
            </p>
            <p className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {formatCurrency(summary?.paid?.amount || 0)}
            </p>
            <p className="text-xs font-semibold text-emerald-600/80">
              {summary?.paid?.count || 0} transferencias realizadas
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-slate-200 dark:border-slate-800 shadow-xs bg-slate-50/50 dark:bg-slate-900/50">
          <CardContent className="p-4 space-y-1">
            <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-1">
              <TrendingUp className="h-3.5 w-3.5 text-indigo-500" /> Generado este Período
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(summary?.thisPeriod?.amount || 0)}
            </p>
            <p className="text-xs font-semibold text-slate-500">
              {summary?.thisPeriod?.count || 0} cálculos registrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Principales */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-xs rounded-2xl overflow-hidden p-1.5 bg-slate-100/70 dark:bg-slate-900/60">
          <TabsList className="grid grid-cols-1 md:grid-cols-3 gap-1.5 bg-transparent h-auto p-0">
            <TabsTrigger
              value="records"
              className="py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/30 data-[state=active]:scale-[1.02]"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>1. Registros & Liquidación en Lote</span>
            </TabsTrigger>

            <TabsTrigger
              value="summary"
              className="py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-purple-500/30 data-[state=active]:scale-[1.02]"
            >
              <Users className="h-4 w-4" />
              <span>2. Resumen por Asesor</span>
            </TabsTrigger>

            <TabsTrigger
              value="schemas"
              className="py-3 px-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 transition-all text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800/60 data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:bg-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/30 data-[state=active]:scale-[1.02]"
            >
              <Layers className="h-4 w-4" />
              <span>3. Esquemas de Comisión ({schemas.length})</span>
            </TabsTrigger>
          </TabsList>
        </Card>

        {/* ═══════════════════ PESTAÑA 1: REGISTROS & LIQUIDACIÓN ═══════════════════ */}
        <TabsContent value="records" className="space-y-4 mt-0">
          {/* Barra de Filtros */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300">
                <Filter className="h-4 w-4 text-blue-600" />
                <span>Filtros de Búsqueda:</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 flex-1 max-w-3xl">
                <div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue placeholder="Estado de comisión" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los estados</SelectItem>
                      <SelectItem value="PENDING">Pendientes</SelectItem>
                      <SelectItem value="APPROVED">Aprobadas</SelectItem>
                      <SelectItem value="PAID">Pagadas</SelectItem>
                      <SelectItem value="CANCELLED">Canceladas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={advisorFilter} onValueChange={setAdvisorFilter}>
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue placeholder="Filtrar por Asesor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los asesores</SelectItem>
                      {advisors.map(adv => (
                        <SelectItem key={adv.id} value={adv.id}>
                          {adv.firstName} {adv.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="rounded-xl h-9 text-xs">
                      <SelectValue placeholder="Tipo de evento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos los tipos</SelectItem>
                      <SelectItem value="ORIGINATION">Originación de Préstamo</SelectItem>
                      <SelectItem value="COLLECTION">Cobranza de Cuota</SelectItem>
                      <SelectItem value="BONUS">Bonos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </Card>

          {/* Barra de Acciones en Lote (Solo cuando hay seleccionados) */}
          {selectedIds.length > 0 && (
            <Card className="rounded-2xl border border-blue-200 dark:border-blue-900 bg-blue-50/80 dark:bg-blue-950/40 p-4 shadow-sm animate-in fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 font-bold text-xs text-blue-900 dark:text-blue-100">
                  <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  <span>{selectedIds.length} comisiones seleccionadas</span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleBatchAction('approve')}
                    disabled={isProcessingAction}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs gap-1 h-8 px-4"
                  >
                    Aprobar Selección ({selectedIds.length})
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => handleBatchAction('pay')}
                    disabled={isProcessingAction}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs gap-1 h-8 px-4"
                  >
                    Pagar Selección ({selectedIds.length})
                  </Button>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleBatchAction('cancel')}
                    disabled={isProcessingAction}
                    className="text-red-600 hover:bg-red-50 text-xs font-bold rounded-xl h-8"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </Card>
          )}

          {/* Tabla de Registros */}
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50 dark:bg-slate-900/80">
                <TableRow>
                  <TableHead className="w-12 text-center">
                    <Checkbox
                      checked={records.length > 0 && selectedIds.length === records.length}
                      onCheckedChange={(checked: boolean) => handleSelectAll(checked)}
                    />
                  </TableHead>
                  <TableHead className="font-bold text-xs">Asesor</TableHead>
                  <TableHead className="font-bold text-xs">Esquema / Concepto</TableHead>
                  <TableHead className="font-bold text-xs">Tipo Evento</TableHead>
                  <TableHead className="font-bold text-xs">Fecha Cálculo</TableHead>
                  <TableHead className="font-bold text-xs">Monto Comisión</TableHead>
                  <TableHead className="font-bold text-xs">Estado</TableHead>
                  <TableHead className="text-right font-bold text-xs">Acción</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-400 font-medium">
                      Cargando registros de comisión...
                    </TableCell>
                  </TableRow>
                ) : records.length > 0 ? (
                  records.map((record) => {
                    const isSelected = selectedIds.includes(record.id);
                    return (
                      <TableRow key={record.id} className={isSelected ? 'bg-blue-50/50 dark:bg-blue-950/20' : ''}>
                        <TableCell className="text-center">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked: boolean) => handleSelectOne(record.id, checked)}
                          />
                        </TableCell>
                        <TableCell className="font-bold text-xs text-slate-900 dark:text-white">
                          {record.advisor?.firstName} {record.advisor?.lastName}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                            {record.schema?.name || 'Esquema'}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {record.sourceType}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px] font-bold rounded-lg">
                            {record.schema?.type === 'ORIGINATION' ? 'Originación' : record.schema?.type === 'COLLECTION' ? 'Cobranza' : 'Bono'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500 font-medium">
                          {new Date(record.calculatedAt).toLocaleDateString('es-MX', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </TableCell>
                        <TableCell className="font-black text-sm text-slate-900 dark:text-white">
                          {formatCurrency(Number(record.amount))}
                        </TableCell>
                        <TableCell>
                          {record.status === 'PAID' ? (
                            <Badge className="bg-emerald-500 text-white font-bold rounded-lg text-[10px]">
                              Pagado
                            </Badge>
                          ) : record.status === 'APPROVED' ? (
                            <Badge className="bg-blue-600 text-white font-bold rounded-lg text-[10px]">
                              Aprobado
                            </Badge>
                          ) : record.status === 'CANCELLED' ? (
                            <Badge variant="secondary" className="text-slate-400 font-bold rounded-lg text-[10px]">
                              Cancelado
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-amber-400 text-amber-600 dark:text-amber-400 font-bold rounded-lg text-[10px]">
                              Pendiente
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {record.status === 'PENDING' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSingleAction(record.id, 'approve')}
                              disabled={isProcessingAction}
                              className="h-7 text-xs font-bold rounded-lg text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              Aprobar
                            </Button>
                          )}
                          {record.status === 'APPROVED' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSingleAction(record.id, 'pay')}
                              disabled={isProcessingAction}
                              className="h-7 text-xs font-bold rounded-lg text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                            >
                              Pagar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-12 text-slate-400 font-medium italic">
                      No se encontraron registros de comisión con los filtros seleccionados.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ═══════════════════ PESTAÑA 2: RESUMEN POR ASESOR ═══════════════════ */}
        <TabsContent value="summary" className="space-y-4 mt-0">
          <Card className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <CardHeader className="bg-slate-50/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800 p-4">
              <CardTitle className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Resumen de Rendimiento & Comisiones por Asesor
              </CardTitle>
              <CardDescription className="text-xs">
                Desglose analítico de comisiones ganadas, pendientes y liquidadas por asesor
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-bold text-xs">Asesor</TableHead>
                    <TableHead className="font-bold text-xs">Total Ganado</TableHead>
                    <TableHead className="font-bold text-xs">Pendiente de Pago</TableHead>
                    <TableHead className="font-bold text-xs">Pagado</TableHead>
                    <TableHead className="font-bold text-xs">Originaciones ($)</TableHead>
                    <TableHead className="font-bold text-xs">Cobranza ($)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summary?.topAdvisors && summary.topAdvisors.length > 0 ? (
                    summary.topAdvisors.map((adv: any) => (
                      <TableRow key={adv.advisorId}>
                        <TableCell className="font-black text-xs text-slate-900 dark:text-white flex items-center gap-2">
                          <div className="h-7 w-7 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center font-bold text-xs">
                            {adv.advisorName.charAt(0)}
                          </div>
                          <span>{adv.advisorName}</span>
                        </TableCell>
                        <TableCell className="font-black text-sm text-slate-900 dark:text-white">
                          {formatCurrency(adv.totalEarned)}
                        </TableCell>
                        <TableCell className="font-bold text-xs text-amber-600">
                          {formatCurrency(adv.totalPending)}
                        </TableCell>
                        <TableCell className="font-bold text-xs text-emerald-600">
                          {formatCurrency(adv.totalPaid)}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-600">
                          {formatCurrency(adv.originationAmount)} ({adv.originationCount} préstamos)
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-slate-600">
                          {formatCurrency(adv.collectionAmount)} ({adv.collectionCount} cobros)
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-slate-400 font-medium italic">
                        Sin datos acumulados de asesores en el período.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ═══════════════════ PESTAÑA 3: ESQUEMAS DE COMISIÓN ═══════════════════ */}
        <TabsContent value="schemas" className="space-y-4 mt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {schemas.map((sch) => {
              let rules: any = {};
              try {
                rules = typeof sch.rules === 'string' ? JSON.parse(sch.rules) : sch.rules;
              } catch (e) {}

              return (
                <Card key={sch.id} className="rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <Badge variant="outline" className="text-[10px] font-bold">
                        {sch.type === 'ORIGINATION' ? 'Originación' : sch.type === 'COLLECTION' ? 'Cobranza' : 'Bono'}
                      </Badge>
                      <Badge className={sch.isActive ? 'bg-emerald-500 text-white text-[10px]' : 'bg-slate-200 text-slate-600 text-[10px]'}>
                        {sch.isActive ? 'Activo' : 'Inactivo'}
                      </Badge>
                    </div>
                    <CardTitle className="text-base font-black text-slate-900 dark:text-white pt-2">
                      {sch.name}
                    </CardTitle>
                    {sch.description && (
                      <CardDescription className="text-xs line-clamp-2">
                        {sch.description}
                      </CardDescription>
                    )}
                  </CardHeader>

                  <CardContent className="space-y-3 pb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                    <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl space-y-1 text-xs">
                      <p className="font-bold text-slate-500 uppercase tracking-wider text-[9px]">Regla de Cálculo</p>
                      {rules.percentage && (
                        <p className="font-black text-blue-600 text-sm">{rules.percentage}% sobre el monto</p>
                      )}
                      {rules.fixedAmount && (
                        <p className="font-black text-indigo-600 text-sm">${rules.fixedAmount} MXN por operación</p>
                      )}
                      {rules.tiers && rules.tiers.length > 0 && (
                        <p className="font-black text-purple-600 text-sm">Escalas ({rules.tiers.length} rangos definidos)</p>
                      )}
                      {rules.minAmount ? (
                        <p className="text-[10px] text-slate-400 font-medium">Monto mín. requerido: ${rules.minAmount}</p>
                      ) : null}
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleToggleSchemaStatus(sch.id, sch.isActive)}
                        className="text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                      >
                        {sch.isActive ? 'Desactivar' : 'Activar'}
                      </Button>

                      <div className="flex items-center gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setSchemaToEdit(sch);
                            setIsSchemaModalOpen(true);
                          }}
                          className="h-8 w-8 p-0 rounded-xl text-blue-600"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteSchema(sch.id)}
                          className="h-8 w-8 p-0 rounded-xl text-red-500 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {schemas.length === 0 && (
              <div className="col-span-full text-center py-16 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-3xl">
                <Layers className="h-10 w-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-bold text-sm">No hay esquemas de comisión configurados</p>
                <p className="text-xs text-slate-400 mt-1">Crea el primer esquema para comenzar a calcular comisiones a asesores.</p>
                <Button
                  onClick={() => {
                    setSchemaToEdit(null);
                    setIsSchemaModalOpen(true);
                  }}
                  className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs gap-2"
                >
                  <Plus className="h-4 w-4" /> Crear Esquema
                </Button>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal de Esquema de Comisión */}
      <CommissionSchemaModal
        isOpen={isSchemaModalOpen}
        onOpenChange={setIsSchemaModalOpen}
        onSuccess={() => {
          fetchSchemas();
          fetchData();
        }}
        schemaToEdit={schemaToEdit}
      />
    </div>
  );
}
