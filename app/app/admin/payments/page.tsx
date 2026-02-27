'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Banknote,
  Building2,
  Plus,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

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
    };
  };
}

export const dynamic = 'force-dynamic';

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalPayments: 0,
    completedPayments: 0,
    pendingPayments: 0,
    totalAmount: 0,
  });
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments?limit=100');
      if (!response.ok) throw new Error('Error al cargar pagos');
      const data = await response.json();
      setPayments(data.payments || []);
      if (data.stats) setStats(data.stats);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Error al cargar los pagos');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(amount);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Completado';
      case 'FAILED': return 'Fallido';
      case 'PENDING': return 'Pendiente';
      default: return status;
    }
  };

  const getMethodLabel = (method: string) => {
    switch (method) {
      case 'CASH': return 'Efectivo';
      case 'SPEI': return 'SPEI';
      case 'BANK_TRANSFER': return 'Transferencia';
      default: return method;
    }
  };

  const getMethodIcon = (method: string) => {
    if (method === 'CASH') return <Banknote className="h-4 w-4 text-green-600" />;
    return <Building2 className="h-4 w-4 text-blue-600" />;
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
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Gestión de Pagos
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Registro de cobros en efectivo y SPEI
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/payments/new">
            <Plus className="h-4 w-4 mr-2" />
            Registrar Cobro
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Cobros</h3>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.totalPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <h3 className="tracking-tight text-sm font-medium">Monto Cobrado</h3>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.totalAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <h3 className="tracking-tight text-sm font-medium">Completados</h3>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.completedPayments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between pb-2">
              <h3 className="tracking-tight text-sm font-medium">Pendientes</h3>
              <Clock className="h-4 w-4 text-yellow-500" />
            </div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="payments" className="space-y-6">
        <TabsList>
          <TabsTrigger value="payments">Historial de Cobros</TabsTrigger>
          <TabsTrigger value="spei">Registrar SPEI</TabsTrigger>
        </TabsList>

        {/* Historial de Cobros */}
        <TabsContent value="payments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historial de Cobros</CardTitle>
                <CardDescription>
                  Todos los pagos registrados (efectivo y SPEI)
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar cliente, préstamo..."
                    className="pl-9 w-64"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" onClick={fetchPayments}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Actualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Préstamo</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Método</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Referencia</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <CreditCard className="h-12 w-12 text-muted-foreground" />
                              <p className="text-muted-foreground">No hay cobros registrados</p>
                              <Button asChild size="sm">
                                <Link href="/admin/payments/new">Registrar primer cobro</Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredPayments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>
                              {payment.loan?.client
                                ? `${payment.loan.client.firstName} ${payment.loan.client.lastName}`
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {payment.loan?.loanNumber || 'N/A'}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {formatCurrency(payment.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                {getMethodIcon(payment.paymentMethod)}
                                <span className="text-sm">{getMethodLabel(payment.paymentMethod)}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(payment.status)}
                                <Badge variant={payment.status === 'COMPLETED' ? 'default' : payment.status === 'FAILED' ? 'destructive' : 'secondary'}>
                                  {getStatusLabel(payment.status)}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground font-mono">
                              {payment.reference || '—'}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(payment.paymentDate).toLocaleDateString('es-MX')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Registrar SPEI */}
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
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-blue-600" />
          Registrar Pago SPEI (Manual)
        </CardTitle>
        <CardDescription>
          Registra una transferencia SPEI recibida manualmente con su número de referencia bancaria
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5 max-w-lg">
          <div className="space-y-2">
            <Label htmlFor="loanId">ID del Préstamo <span className="text-red-500">*</span></Label>
            <Input
              id="loanId"
              placeholder="Pega el ID del préstamo"
              value={form.loanId}
              onChange={e => setForm(f => ({ ...f, loanId: e.target.value }))}
              required
            />
            <p className="text-xs text-muted-foreground">Puedes copiar el ID desde la pantalla de detalle del préstamo.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Monto Recibido (MXN) <span className="text-red-500">*</span></Label>
            <Input
              id="amount"
              type="number"
              min="1"
              step="0.01"
              placeholder="0.00"
              value={form.amount}
              onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference">Referencia SPEI / Folio <span className="text-red-500">*</span></Label>
            <Input
              id="reference"
              placeholder="Ej: 202602261234567890"
              value={form.reference}
              onChange={e => setForm(f => ({ ...f, reference: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentDate">Fecha del Depósito</Label>
            <Input
              id="paymentDate"
              type="date"
              value={form.paymentDate}
              onChange={e => setForm(f => ({ ...f, paymentDate: e.target.value }))}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea
              id="notes"
              placeholder="Notas adicionales sobre la transferencia..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? (
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Registrando...
              </div>
            ) : (
              <>
                <Building2 className="h-4 w-4 mr-2" />
                Registrar Pago SPEI
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
