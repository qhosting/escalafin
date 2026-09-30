'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  Calendar,
  Users,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Banknote,
  Building2,
  DollarSign,
  ArrowRight,
  Sparkles,
  CreditCard,
  Layers,
  RotateCcw,
  Check,
  CheckSquare,
  Square
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface BulkCandidate {
  loanId: string;
  loanNumber: string;
  loanType: string;
  paymentFrequency: string;
  principalAmount: number;
  balanceRemaining: number;
  monthlyPayment: number;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    asesor?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  nextSchedule: {
    id: string;
    paymentNumber: number;
    paymentDate: string;
    totalPayment: number;
    principalPayment: number;
    interestPayment: number;
    remainingBalance: number;
    dayOfWeek: number;
    dayName: string;
    dayOfMonth: number;
    isOverdue: boolean;
    daysOverdue: number;
  } | null;
  suggestedPayment: number;
}

interface Advisor {
  id: string;
  firstName: string;
  lastName: string;
}

interface BulkPaymentTabProps {
  advisors: Advisor[];
  onPaymentSuccess?: () => void;
}

export function BulkPaymentTab({ advisors, onPaymentSuccess }: BulkPaymentTabProps) {
  const [candidates, setCandidates] = useState<BulkCandidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Filtros
  const [search, setSearch] = useState('');
  const [advisorId, setAdvisorId] = useState('all');
  const [dayOfWeek, setDayOfWeek] = useState('all');
  const [frequency, setFrequency] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Selección y montos editados
  // selectedLoanIds guarda qué préstamos están marcados
  const [selectedLoans, setSelectedLoans] = useState<{ [loanId: string]: boolean }>({});
  // customAmounts guarda el monto que se va a pagar por préstamo (por defecto = suggestedPayment)
  const [customAmounts, setCustomAmounts] = useState<{ [loanId: string]: number }>({});

  // Parámetros de cobro del lote
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'BANK_TRANSFER'>('CASH');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [batchNotes, setBatchNotes] = useState('Cobro masivo de ruta');

  // Diálogo de confirmación
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Cargar candidatos desde la API
  const fetchCandidates = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search.trim()) params.append('search', search.trim());
      if (advisorId !== 'all') params.append('advisorId', advisorId);
      if (dayOfWeek !== 'all') params.append('dayOfWeek', dayOfWeek);
      if (frequency !== 'all') params.append('frequency', frequency);
      if (statusFilter !== 'all') params.append('statusFilter', statusFilter);

      const res = await fetch(`/api/payments/bulk-candidates?${params.toString()}`);
      if (!res.ok) throw new Error('Error al cargar clientes para cobro masivo');
      const data = await res.json();
      const list: BulkCandidate[] = data.candidates || [];
      setCandidates(list);

      // Preseleccionar todos por defecto e inicializar montos sugeridos
      const initialSelected: { [id: string]: boolean } = {};
      const initialAmounts: { [id: string]: number } = {};
      list.forEach((c) => {
        initialSelected[c.loanId] = true;
        initialAmounts[c.loanId] = c.suggestedPayment;
      });
      setSelectedLoans(initialSelected);
      setCustomAmounts(initialAmounts);
    } catch (err: any) {
      console.error(err);
      toast.error('Error al cargar cartera para abono masivo');
    } finally {
      setLoading(false);
    }
  }, [search, advisorId, dayOfWeek, frequency, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchCandidates();
    }, 350);
    return () => clearTimeout(timer);
  }, [fetchCandidates]);

  // Selección masiva: toggle todos
  const allSelected = useMemo(() => {
    if (candidates.length === 0) return false;
    return candidates.every((c) => selectedLoans[c.loanId]);
  }, [candidates, selectedLoans]);

  const toggleSelectAll = () => {
    const nextState = !allSelected;
    const updated: { [id: string]: boolean } = {};
    candidates.forEach((c) => {
      updated[c.loanId] = nextState;
    });
    setSelectedLoans(updated);
  };

  const toggleSelectOne = (loanId: string) => {
    setSelectedLoans((prev) => ({
      ...prev,
      [loanId]: !prev[loanId],
    }));
  };

  // Cambiar monto editable de un cliente
  const handleAmountChange = (loanId: string, value: string) => {
    const num = parseFloat(value);
    setCustomAmounts((prev) => ({
      ...prev,
      [loanId]: isNaN(num) ? 0 : num,
    }));
  };

  // Restablecer todos al pago sugerido / cuota fija
  const resetToSuggestedAmounts = () => {
    const restored: { [id: string]: number } = {};
    candidates.forEach((c) => {
      restored[c.loanId] = c.suggestedPayment;
    });
    setCustomAmounts(restored);
    toast.info('Montos reestablecidos al pago sugerido por cuota');
  };

  // Cálculo de totales seleccionados
  const selectedCount = useMemo(() => {
    return candidates.filter((c) => selectedLoans[c.loanId]).length;
  }, [candidates, selectedLoans]);

  const selectedTotalAmount = useMemo(() => {
    return candidates
      .filter((c) => selectedLoans[c.loanId])
      .reduce((sum, c) => sum + (customAmounts[c.loanId] || 0), 0);
  }, [candidates, selectedLoans, customAmounts]);

  // Enviar abono masivo
  const handleApplyBulkPayment = async () => {
    const paymentsToApply = candidates
      .filter((c) => selectedLoans[c.loanId] && (customAmounts[c.loanId] || 0) > 0)
      .map((c) => ({
        loanId: c.loanId,
        amount: customAmounts[c.loanId],
        scheduleId: c.nextSchedule?.id,
      }));

    if (paymentsToApply.length === 0) {
      toast.warning('No hay clientes seleccionados con monto mayor a $0');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/payments/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payments: paymentsToApply,
          paymentMethod,
          paymentDate,
          notes: batchNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error al procesar abonos masivos');
      }

      toast.success(
        `¡Abono masivo aplicado con éxito! Se registraron ${data.processedCount} pagos por un total de $${data.totalAmount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN.`
      );

      setConfirmOpen(false);
      // Recargar lista y avisar al componente padre
      await fetchCandidates();
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Error al procesar el lote de abonos');
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);

  return (
    <div className="space-y-6">
      {/* ── BARRA DE FILTROS SUPERIOR ── */}
      <Card className="border border-gray-100 dark:border-gray-800 rounded-3xl shadow-sm bg-white dark:bg-gray-900/50 backdrop-blur-md">
        <CardContent className="p-4 sm:p-5 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 border-b border-gray-100 dark:border-gray-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-black">
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                  Filtros de Cartera para Abono Masivo
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Selecciona por día de cobro, asesor o periodicidad para aplicar el pago en lote
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={fetchCandidates}
              disabled={loading}
              className="rounded-xl text-xs font-bold gap-1.5 h-9"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Actualizar Cartera</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* Buscador */}
            <div className="space-y-1.5 lg:col-span-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Buscar Cliente o Contrato
              </Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nombre, teléfono o contrato..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 h-11 rounded-xl bg-gray-50/70 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-xs"
                />
              </div>
            </div>

            {/* Asesor */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Asesor Asignado
              </Label>
              <Select value={advisorId} onValueChange={setAdvisorId}>
                <SelectTrigger className="h-11 rounded-xl bg-gray-50/70 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Users className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <SelectValue placeholder="Todos" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos los Asesores</SelectItem>
                  {advisors.map((adv) => (
                    <SelectItem key={adv.id} value={adv.id}>
                      {adv.firstName} {adv.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Día de Pago */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Día de Pago / Ruta
              </Label>
              <Select value={dayOfWeek} onValueChange={setDayOfWeek}>
                <SelectTrigger className="h-11 rounded-xl bg-gray-50/70 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <SelectValue placeholder="Cualquier Día" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Cualquier Día</SelectItem>
                  <SelectItem value="1">Lunes</SelectItem>
                  <SelectItem value="2">Martes</SelectItem>
                  <SelectItem value="3">Miércoles</SelectItem>
                  <SelectItem value="4">Jueves</SelectItem>
                  <SelectItem value="5">Viernes</SelectItem>
                  <SelectItem value="6">Sábado</SelectItem>
                  <SelectItem value="0">Domingo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Estado / Vencimiento */}
            <div className="space-y-1.5">
              <Label className="text-[10px] font-black uppercase text-gray-400 tracking-wider">
                Estado de Cuota
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="h-11 rounded-xl bg-gray-50/70 dark:bg-gray-900 border-gray-200 dark:border-gray-800 text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <Filter className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                    <SelectValue placeholder="Todos" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos con Saldo</SelectItem>
                  <SelectItem value="overdue">En Mora (Vencidos)</SelectItem>
                  <SelectItem value="due_today">Vencen Hoy</SelectItem>
                  <SelectItem value="due_week">Vencen Esta Semana</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── PANEL DE CONFIGURACIÓN Y ACCIÓN MASIVA (Sticky/Destacado) ── */}
      <Card className="border-2 border-indigo-200/80 dark:border-indigo-900/80 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/60 dark:from-slate-900 dark:via-gray-900 dark:to-indigo-950/40 rounded-3xl shadow-lg shadow-indigo-100/30 overflow-hidden">
        <CardContent className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Métricas del Lote */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="bg-white dark:bg-gray-950/70 p-3 px-4 rounded-2xl border border-indigo-100 dark:border-indigo-900 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 block">
                  Clientes Marcados
                </span>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                    {selectedCount}
                  </span>
                  <span className="text-xs font-bold text-gray-400">/ {candidates.length} disponibles</span>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-950/70 p-3 px-4 rounded-2xl border border-emerald-100 dark:border-emerald-900 shadow-xs">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
                  Monto Total a Recaudar
                </span>
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 block mt-0.5">
                  {formatCurrency(selectedTotalAmount)}
                </span>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={resetToSuggestedAmounts}
                className="text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-white/80 dark:hover:bg-gray-800 rounded-xl gap-1.5"
              >
                <RotateCcw className="h-3.5 w-3.5 text-indigo-500" />
                <span>Restablecer Montos Sugeridos</span>
              </Button>
            </div>

            {/* Configuración del Pago */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-gray-400">Método</Label>
                <Select value={paymentMethod} onValueChange={(v: any) => setPaymentMethod(v)}>
                  <SelectTrigger className="h-10 w-36 rounded-xl bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-xs font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="CASH">Efectivo</SelectItem>
                    <SelectItem value="BANK_TRANSFER">Transferencia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase text-gray-400">Fecha del Pago</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  className="h-10 w-36 rounded-xl bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800 text-xs font-bold"
                />
              </div>

              {/* Botón Disparador Principal */}
              <div className="pt-4 sm:pt-0">
                <Button
                  onClick={() => setConfirmOpen(true)}
                  disabled={selectedCount === 0 || selectedTotalAmount <= 0 || loading}
                  className="h-11 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-black text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all active:scale-95 gap-2"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Aplicar Abono Masivo ({selectedCount})</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ── TABLA DE CLIENTES Y CUOTAS ── */}
      <Card className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xl shadow-gray-200/20 bg-white dark:bg-gray-900">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-10 space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between p-4 border rounded-2xl gap-4">
                  <div className="h-6 w-48 bg-gray-100 animate-pulse rounded" />
                  <div className="h-6 w-32 bg-gray-100 animate-pulse rounded" />
                  <div className="h-8 w-28 bg-gray-100 animate-pulse rounded-xl" />
                </div>
              ))}
            </div>
          ) : candidates.length === 0 ? (
            <div className="p-14 text-center space-y-3">
              <Users className="h-12 w-12 text-gray-300 mx-auto" />
              <h4 className="text-base font-bold text-gray-900 dark:text-white">
                No se encontraron créditos con saldo para los filtros seleccionados
              </h4>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Prueba cambiando el día de la semana, el asesor asignado o borrando el término de búsqueda.
              </p>
              <Button variant="outline" size="sm" onClick={fetchCandidates} className="rounded-xl mt-2">
                Limpiar Filtros
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-slate-900 dark:bg-slate-950">
                <TableRow className="hover:bg-transparent border-0 h-14">
                  <TableHead className="w-12 pl-5 text-white">
                    <button
                      type="button"
                      onClick={toggleSelectAll}
                      className="p-1 text-white hover:text-indigo-300 transition-colors flex items-center justify-center"
                    >
                      {allSelected ? (
                        <CheckSquare className="h-5 w-5 text-emerald-400" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                  </TableHead>
                  <TableHead className="text-white font-black uppercase tracking-widest text-[11px]">
                    Cliente / Asesor
                  </TableHead>
                  <TableHead className="text-white font-black uppercase tracking-widest text-[11px]">
                    Crédito / Saldo Actual
                  </TableHead>
                  <TableHead className="text-white font-black uppercase tracking-widest text-[11px]">
                    Vencimiento / Cuota
                  </TableHead>
                  <TableHead className="text-white font-black uppercase tracking-widest text-[11px]">
                    Pago Sugerido (Fijo)
                  </TableHead>
                  <TableHead className="text-white font-black uppercase tracking-widest text-[11px] w-48">
                    Monto a Abonar (MXN)
                  </TableHead>
                  <TableHead className="text-white font-black uppercase tracking-widest text-[11px] pr-5 text-right">
                    Saldo Restante Est.
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {candidates.map((c) => {
                  const isChecked = !!selectedLoans[c.loanId];
                  const currentAmount = customAmounts[c.loanId] ?? c.suggestedPayment;
                  const estimatedRemaining = Math.max(0, c.balanceRemaining - (isChecked ? currentAmount : 0));

                  return (
                    <TableRow
                      key={c.loanId}
                      className={`transition-colors border-b border-gray-100 dark:border-gray-800 ${
                        isChecked
                          ? 'bg-indigo-50/30 dark:bg-indigo-950/20'
                          : 'opacity-60 hover:opacity-100'
                      }`}
                    >
                      {/* Checkbox */}
                      <TableCell className="pl-5">
                        <Checkbox
                          checked={isChecked}
                          onCheckedChange={() => toggleSelectOne(c.loanId)}
                          className="h-5 w-5 rounded-md data-[state=checked]:bg-indigo-600 data-[state=checked]:border-indigo-600"
                        />
                      </TableCell>

                      {/* Cliente y Asesor */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">
                            {c.client.firstName} {c.client.lastName}
                          </p>
                          <div className="flex items-center gap-2 text-[11px] text-gray-500">
                            <span>{c.client.phone}</span>
                            {c.client.asesor && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 rounded font-normal">
                                Asesor: {c.client.asesor.firstName}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>

                      {/* Contrato y Saldo */}
                      <TableCell>
                        <div className="space-y-0.5">
                          <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">
                            {c.loanNumber}
                          </span>
                          <p className="text-xs font-black text-gray-900 dark:text-white">
                            Saldo: {formatCurrency(c.balanceRemaining)}
                          </p>
                        </div>
                      </TableCell>

                      {/* Vencimiento */}
                      <TableCell>
                        {c.nextSchedule ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-gray-800 dark:text-gray-200">
                                {format(new Date(c.nextSchedule.paymentDate), 'dd/MM/yyyy')}
                              </span>
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-bold">
                                {c.nextSchedule.dayName}
                              </Badge>
                            </div>
                            {c.nextSchedule.isOverdue ? (
                              <Badge className="bg-red-500 hover:bg-red-600 text-white text-[10px] px-1.5 py-0 font-bold">
                                {c.nextSchedule.daysOverdue} días vencido
                              </Badge>
                            ) : (
                              <span className="text-[11px] text-emerald-600 font-medium">Cuota al corriente</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Sin calendario</span>
                        )}
                      </TableCell>

                      {/* Pago sugerido / Fijo */}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {formatCurrency(c.suggestedPayment)}
                          </span>
                          {currentAmount !== c.suggestedPayment && (
                            <button
                              type="button"
                              onClick={() =>
                                setCustomAmounts((prev) => ({
                                  ...prev,
                                  [c.loanId]: c.suggestedPayment,
                                }))
                              }
                              className="text-[10px] text-indigo-600 hover:underline font-bold"
                            >
                              Fijar
                            </button>
                          )}
                        </div>
                      </TableCell>

                      {/* Input de monto editable */}
                      <TableCell>
                        <div className="relative">
                          <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                          <Input
                            type="number"
                            step="any"
                            disabled={!isChecked}
                            value={customAmounts[c.loanId] ?? c.suggestedPayment}
                            onChange={(e) => handleAmountChange(c.loanId, e.target.value)}
                            className="pl-7 h-9 text-xs font-black text-gray-900 dark:text-white rounded-xl bg-white dark:bg-gray-950 border-gray-200 dark:border-gray-800"
                          />
                        </div>
                      </TableCell>

                      {/* Saldo estimado restante */}
                      <TableCell className="pr-5 text-right">
                        <span
                          className={`text-xs font-black ${
                            estimatedRemaining === 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-gray-900 dark:text-white'
                          }`}
                        >
                          {estimatedRemaining === 0 ? 'LIQUIDA ✓' : formatCurrency(estimatedRemaining)}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </div>
      </Card>

      {/* ── MODAL DE CONFIRMACIÓN ── */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white dark:bg-gray-900">
          <DialogHeader className="space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 flex items-center justify-center">
              <Banknote className="h-6 w-6" />
            </div>
            <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">
              Confirmar Abono Masivo
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Estás a punto de aplicar los pagos de golpe a los clientes seleccionados. Verifica el resumen antes de proceder:
            </DialogDescription>
          </DialogHeader>

          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl space-y-2.5 border border-gray-100 dark:border-gray-800 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Total de clientes a cobrar:</span>
              <span className="font-bold text-gray-900 dark:text-white">{selectedCount} créditos</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Monto total a registrar:</span>
              <span className="font-black text-emerald-600 text-sm">{formatCurrency(selectedTotalAmount)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Método de pago:</span>
              <span className="font-bold text-gray-900 dark:text-white">
                {paymentMethod === 'CASH' ? 'Efectivo en campo' : 'Transferencia Bancaria'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500">Fecha contable:</span>
              <span className="font-bold text-gray-900 dark:text-white">{paymentDate}</span>
            </div>
          </div>

          <div className="space-y-1.5 pt-2">
            <Label className="text-[10px] font-black uppercase text-gray-400">Nota / Referencia de Ruta</Label>
            <Input
              value={batchNotes}
              onChange={(e) => setBatchNotes(e.target.value)}
              placeholder="Ej. Cobranza ruta lunes Centro..."
              className="h-10 text-xs rounded-xl"
            />
          </div>

          <DialogFooter className="flex-row gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setConfirmOpen(false)}
              disabled={submitting}
              className="flex-1 rounded-xl text-xs"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleApplyBulkPayment}
              disabled={submitting}
              className="flex-1 rounded-xl text-xs font-black bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {submitting ? (
                <div className="flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                  <span>Aplicando...</span>
                </div>
              ) : (
                <span>Confirmar y Aplicar</span>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
export default BulkPaymentTab;
