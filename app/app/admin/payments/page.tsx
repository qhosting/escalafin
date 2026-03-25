'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  CreditCard,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Banknote,
  Building2,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  ChevronRight,
  User as UserIcon
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Payment {
  id: string;
  amount: number;
  status: string;
  paymentMethod: string;
  paymentDate: string;
  reference?: string;
  notes?: string;
  loan?: {
    loanNumber: string;
    client?: {
      firstName: string;
      lastName: string;
      asesor?: {
        firstName: string;
        lastName: string;
      }
    };
  };
}

interface Advisor {
  id: string;
  firstName: string;
  lastName: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [advisors, setAdvisors] = useState<Advisor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Filtros
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [advisorId, setAdvisorId] = useState('all');

  const fetchAdvisors = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        // Filtrar solo los que sean ASESOR o tengan clientes asignados
        const advisorUsers = data.users.filter((u: any) => u.role === 'ASESOR' || u.role === 'ADMIN');
        setAdvisors(advisorUsers);
      }
    } catch (e) {
      console.error('Error fetching advisors:', e);
    }
  };

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      let url = `/api/payments?limit=200`;
      if (startDate) url += `&startDate=${startDate}`;
      if (endDate) url += `&endDate=${endDate}`;
      if (advisorId !== 'all') url += `&advisorId=${advisorId}`;

      const response = await fetch(url);
      if (!response.ok) throw new Error('Error al cargar pagos');
      const data = await response.json();
      setPayments(data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Error al cargar la lista de cobros');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, advisorId]);

  useEffect(() => {
    fetchAdvisors();
    fetchPayments();
  }, [fetchPayments]);

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': 
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-0 font-black text-[10px] uppercase px-2 py-0.5"><CheckCircle className="h-3 w-3 mr-1" /> Completado</Badge>;
      case 'FAILED': 
        return <Badge variant="destructive" className="font-black text-[10px] uppercase px-2 py-0.5">Fallido</Badge>;
      default: 
        return <Badge variant="outline" className="font-black text-[10px] uppercase px-2 py-0.5">Pendiente</Badge>;
    }
  };

  const getMethodIcon = (method: string) => {
    if (method === 'CASH') return <Banknote className="h-5 w-5 text-green-600" />;
    return <Building2 className="h-5 w-5 text-blue-600" />;
  };

  const filteredPayments = payments.filter(p => {
    if (!search) return true;
    const clientName = p.loan?.client ? `${p.loan.client.firstName} ${p.loan.client.lastName}`.toLowerCase() : '';
    const loanNum = p.loan?.loanNumber?.toLowerCase() || '';
    const ref = p.reference?.toLowerCase() || '';
    const s = search.toLowerCase();
    return clientName.includes(s) || loanNum.includes(s) || ref.includes(s);
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 pb-12">
      {/* Header Premium - Sin cajas de resumen como se solicitó */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-4">
        <div className="space-y-1">
          <Badge className="bg-blue-600/10 text-blue-700 hover:bg-blue-600/10 border-0 font-black text-[11px] uppercase tracking-wider px-3 mb-2">
            Finanzas & Control
          </Badge>
          <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight leading-none">
            Gestión de <span className="text-blue-600">Cobros</span>
          </h1>
          <p className="text-base md:text-lg text-gray-500 font-medium">
            Historial detallado y filtros avanzados de recaudación.
          </p>
        </div>
        <Button asChild size="lg" className="h-14 px-8 rounded-2xl font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
          <Link href="/admin/payments/new">
            <Plus className="h-5 w-5 mr-2" />
            Registrar Pago
          </Link>
        </Button>
      </div>

      {/* Filtros Avanzados */}
      <Card className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-sm">
        <CardContent className="p-4 md:p-6 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Buscador */}
            <div className="space-y-2 lg:col-span-1">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cliente o Préstamo..."
                  className="pl-10 h-12 rounded-xl bg-white dark:bg-gray-900 border-gray-200"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Filtro Fecha Inicio */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Desde</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  className="pl-10 h-12 rounded-xl bg-white dark:bg-gray-900 border-gray-200"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                />
              </div>
            </div>

            {/* Filtro Fecha Fin */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Hasta</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="date"
                  className="pl-10 h-12 rounded-xl bg-white dark:bg-gray-900 border-gray-200"
                  value={endDate}
                  onChange={e => setEndDate(e.target.value)}
                />
              </div>
            </div>

            {/* Filtro Asesor */}
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase text-gray-400 ml-1">Asesor / Cobrador</Label>
              <Select value={advisorId} onValueChange={setAdvisorId}>
                <SelectTrigger className="h-12 rounded-xl bg-white dark:bg-gray-900 border-gray-200">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-400" />
                    <SelectValue placeholder="Seleccionar Asesor" />
                  </div>
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">Todos los Asesores</SelectItem>
                  {advisors.map(adv => (
                    <SelectItem key={adv.id} value={adv.id}>
                      {adv.firstName} {adv.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historial con Texto más grande y optimizado */}
      <Tabs defaultValue="payments" className="w-full">
        <TabsList className="bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-4 h-14">
          <TabsTrigger value="payments" className="rounded-xl px-8 h-12 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Historial de Cobros
          </TabsTrigger>
          <TabsTrigger value="spei" className="rounded-xl px-8 h-12 font-bold data-[state=active]:bg-white data-[state=active]:shadow-sm">
            Registro SPEI
          </TabsTrigger>
        </TabsList>

        <TabsContent value="payments">
          <Card className="border border-gray-100 dark:border-gray-800 rounded-3xl overflow-hidden shadow-xl shadow-gray-200/20">
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-20 flex flex-col items-center justify-center gap-4">
                  <RefreshCw className="h-10 w-10 text-blue-600 animate-spin" />
                  <p className="font-bold text-gray-500 animate-pulse text-xl">Sincronizando Cobros...</p>
                </div>
              ) : (
                <Table>
                  <TableHeader className="bg-gray-900 dark:bg-gray-950">
                    <TableRow className="hover:bg-transparent border-0 h-16">
                      <TableHead className="text-white font-black uppercase tracking-widest text-[11px] pl-6">Cliente & Préstamo</TableHead>
                      <TableHead className="text-white font-black uppercase tracking-widest text-[11px]">Monto</TableHead>
                      <TableHead className="text-white font-black uppercase tracking-widest text-[11px]">Estado & Método</TableHead>
                      <TableHead className="text-white font-black uppercase tracking-widest text-[11px]">Asesor</TableHead>
                      <TableHead className="text-white font-black uppercase tracking-widest text-[11px] pr-6 text-right">Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayments.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="h-80 text-center">
                          <div className="flex flex-col items-center justify-center gap-4 text-gray-400">
                            <CreditCard className="h-16 w-16 opacity-20" />
                            <p className="text-xl font-bold">No se encontraron cobros registrados</p>
                            <Button variant="outline" className="rounded-xl" onClick={fetchPayments}>
                              Limpiar Filtros
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredPayments.map((payment) => (
                        <TableRow key={payment.id} className="h-24 hover:bg-gray-50 dark:hover:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 group">
                          <TableCell className="pl-6">
                            <div className="space-y-1">
                              <p className="text-lg font-black text-gray-900 dark:text-gray-100 leading-tight">
                                {payment.loan?.client?.firstName} {payment.loan?.client?.lastName}
                              </p>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-black bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded leading-none">
                                  {payment.loan?.loanNumber || 'TICKET'}
                                </span>
                                <span className="text-xs text-gray-400 font-mono">
                                  Ref: {payment.reference || '--'}
                                </span>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-2xl font-black text-blue-700 tracking-tighter">
                              {formatCurrency(payment.amount)}
                            </p>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-2">
                              {getStatusBadge(payment.status)}
                              <div className="flex items-center gap-2 text-[11px] font-bold text-gray-500 uppercase ml-1">
                                {getMethodIcon(payment.paymentMethod)}
                                {payment.paymentMethod === 'CASH' ? 'Efectivo' : 'Depósito/SPEI'}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-600 dark:text-gray-400">
                              <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <UserIcon className="h-4 w-4 text-blue-600" />
                              </div>
                              {payment.loan?.client?.asesor 
                                ? `${payment.loan.client.asesor.firstName}` 
                                : 'Sistema'}
                            </div>
                          </TableCell>
                          <TableCell className="pr-6 text-right">
                            <div className="space-y-1">
                              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                {format(new Date(payment.paymentDate), "d 'de' MMM", { locale: es })}
                              </p>
                              <p className="text-xs text-gray-400 uppercase font-bold">
                                {format(new Date(payment.paymentDate), "yyyy", { locale: es })}
                              </p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="spei">
          <SpeiManualForm onSuccess={fetchPayments} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SpeiManualForm({ onSuccess }: { onSuccess: () => void }) {
  const [form, setForm] = useState({
    loanId: '',
    amount: '',
    reference: '',
    paymentDate: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.loanId || !form.amount || !form.reference) {
      toast.error('Completa los campos requeridos: préstamo, monto y referencia SPEI');
      return;
    }
    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('loanId', form.loanId);
      fd.append('amount', form.amount);
      fd.append('paymentDate', form.paymentDate);
      fd.append('receiptNumber', form.reference);
      fd.append('notes', form.notes);
      fd.append('collectionMethod', 'SPEI');

      const res = await fetch('/api/payments/spei', { method: 'POST', body: fd });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error al registrar SPEI');
      }
      toast.success('Pago SPEI registrado correctamente');
      setForm({ loanId: '', amount: '', reference: '', paymentDate: new Date().toISOString().split('T')[0], notes: '' });
      onSuccess();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al registrar');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="rounded-3xl overflow-hidden border-orange-100">
      <CardHeader className="bg-orange-50/50 dark:bg-orange-950/20 border-b">
        <CardTitle className="flex items-center gap-2 text-2xl font-black">
          <Building2 className="h-6 w-6 text-orange-600" />
          Registro Manual SPEI
        </CardTitle>
        <CardDescription>
          Ingresa transferencias recibidas con su folio de rastreo bancario.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-8">
        <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label htmlFor="loanId" className="text-sm font-black uppercase text-gray-500">ID del Préstamo</Label>
              <Input
                id="loanId"
                placeholder="ID o Folio de Préstamo"
                className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-bold text-lg"
                value={form.loanId}
                onChange={e => setForm(f => ({ ...f, loanId: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="amount" className="text-sm font-black uppercase text-gray-500">Monto Recibido (MXN)</Label>
              <Input
                id="amount"
                type="number"
                min="1"
                step="0.01"
                placeholder="0.00"
                className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-black text-2xl text-blue-700"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="reference" className="text-sm font-black uppercase text-gray-500">Referencia Bancaria</Label>
              <Input
                id="reference"
                placeholder="Folio SPEI"
                className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-mono font-bold"
                value={form.reference}
                onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
                required
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="paymentDate" className="text-sm font-black uppercase text-gray-500">Fecha Valor</Label>
              <Input
                id="paymentDate"
                type="date"
                className="h-14 rounded-2xl bg-gray-50 border-gray-100 font-bold"
                value={form.paymentDate}
                onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="notes" className="text-sm font-black uppercase text-gray-500">Observaciones</Label>
            <Textarea
              id="notes"
              placeholder="Notas del depósito..."
              className="rounded-2xl bg-gray-50 border-gray-100 text-lg"
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full h-16 rounded-2xl font-black text-xl uppercase tracking-widest transition-all bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20">
            {submitting ? (
              <RefreshCw className="h-6 w-6 animate-spin mr-3" />
            ) : (
              <CheckCircle className="h-6 w-6 mr-3" />
            )}
            {submitting ? 'Procesando...' : 'Confirmar de Pago'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
