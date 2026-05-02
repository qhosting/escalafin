
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  User,
  CreditCard,
  Calendar,
  DollarSign,
  FileText,
  Edit,
  Trash2,
  Plus,
  Eye,
  Download,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { LoanStatementModal } from './loan-statement-modal';
import { PageSkeleton } from '@/components/ui/page-skeleton';
import { AmortizationSchedule } from './amortization-schedule';
import { RefinanceModal } from './refinance-modal';

interface LoanDetail {
  id: string;
  loanNumber: string;
  loanType: string;
  loanCalculationType?: string;
  principalAmount: number;
  balanceRemaining: number;
  insuranceAmount?: number;
  disbursementFee?: number;
  disbursedAmount?: number;
  termMonths: number;
  interestRate: number;
  weeklyInterestAmount?: number;
  monthlyPayment: number;
  status: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    monthlyIncome?: number;
    creditScore?: number;
  };
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    status: string;
    paymentMethod: string;
    reference?: string;
    notes?: string;
  }>;
}

interface LoanDetailsProps {
  loanId: string;
  userRole?: string;
}

const statusConfig: Record<string, { label: string, color: string }> = {
  ACTIVE: { label: 'Activo', color: 'status-badge-active' },
  PAID_OFF: { label: 'Liquidado', color: 'status-badge-completed' },
  DEFAULTED: { label: 'En Mora', color: 'status-badge-failed' },
  CANCELLED: { label: 'Cancelado', color: 'status-badge-cancelled' },
  PENDING: { label: 'Pendiente', color: 'status-badge-pending' },
  APPROVED: { label: 'Aprobado', color: 'bg-indigo-100 text-indigo-700' },
  REJECTED: { label: 'Rechazado', color: 'bg-rose-100 text-rose-700' }
};

const loanTypeConfig = {
  PERSONAL: 'Personal',
  BUSINESS: 'Empresarial',
  MORTGAGE: 'Hipotecario',
  AUTO: 'Automotriz',
  EDUCATION: 'Educativo'
};

const calculationTypeConfig = {
  INTERES: 'Con Interés (Tasa Anual)',
  TARIFA_FIJA: 'Tarifa Fija por Monto',
  INTERES_SEMANAL: 'Interés Semanal Fijo'
};

const paymentStatusConfig = {
  COMPLETED: { label: 'Completado', color: 'status-badge-completed' },
  PENDING: { label: 'Pendiente', color: 'status-badge-pending' },
  FAILED: { label: 'Fallido', color: 'status-badge-failed' }
};

export function LoanDetails({ loanId, userRole }: LoanDetailsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'details';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [isRefinanceModalOpen, setIsRefinanceModalOpen] = useState(false);

  useEffect(() => {
    fetchLoanDetails();
  }, [loanId]);

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['details', 'payments', 'schedule', 'client'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const [errorInfo, setErrorInfo] = useState<{ code?: string; message?: string; status?: number } | null>(null);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      setErrorInfo(null);
      const response = await fetch(`/api/loans/${loanId}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        setErrorInfo({
          code: errorData.code || 'UNKNOWN',
          message: errorData.message || errorData.error || 'Error al cargar el préstamo',
          status: response.status
        });
        return;
      }

      const data = await response.json();
      setLoan(data.loan || data);
    } catch (error) {
      console.error('Error fetching loan details:', error);
      setErrorInfo({
        code: 'NETWORK_ERROR',
        message: 'No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.',
        status: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
  };

  const formatDatetime = (dateString: string) => {
    return format(new Date(dateString), "dd 'de' MMM, yyyy 'a las' HH:mm", { locale: es });
  };

  const calculateProgress = () => {
    if (!loan) return 0;
    const paid = loan.principalAmount - loan.balanceRemaining;
    return (paid / loan.principalAmount) * 100;
  };  const handlePaymentAction = async (payment: any, action: 'view' | 'download') => {
    try {
      const { generatePaymentReceiptPDF } = await import('@/lib/pdf-utils');
      
      const receiptData = {
        tenantName: session?.user?.tenantName || 'EscalaFin',
        paymentId: payment.id,
        amount: payment.amount,
        date: formatDate(payment.paymentDate),
        clientName: loan?.client ? `${loan.client.firstName} ${loan.client.lastName}` : 'Cliente Desconocido',
        loanNumber: loan?.loanNumber || 'N/A',
        concept: payment.notes || 'Abono a capital / Mensualidad',
        paymentMethod: payment.paymentMethod,
        balanceAfter: loan?.balanceRemaining || 0,
        clientAddress: (loan?.client as any)?.address || null
      };

      const pdfUrl = await generatePaymentReceiptPDF(receiptData);
      
      if (action === 'view') {
        const win = window.open(pdfUrl, '_blank');
        if (!win) {
          toast.error('El navegador bloqueó la ventana emergente. Por favor, permite ventanas emergentes para este sitio.');
        }
      } else {
        const link = document.createElement('a');
        link.href = pdfUrl;
        link.download = `Recibo_${loan!.loanNumber}_${payment.id.substring(0,6)}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Error generating receipt:', error);
      toast.error('Error al generar el recibo');
    }
  };

  if (loading) {
    return <PageSkeleton />;
  }

  if (errorInfo || !loan) {
    const isCrossTenant = errorInfo?.code === 'CROSS_TENANT_ACCESS';
    const isNotFound = errorInfo?.code === 'NOT_FOUND' || (!errorInfo && !loan);

    return (
      <div className="flex items-center justify-center min-h-[60vh] p-4">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          {/* Icono */}
          <div className={cn(
            'mx-auto w-20 h-20 rounded-3xl flex items-center justify-center',
            isCrossTenant 
              ? 'bg-red-100 dark:bg-red-900/20' 
              : 'bg-orange-100 dark:bg-orange-900/20'
          )}>
            {isCrossTenant ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v.01M12 9v2m0 0a1 1 0 100-2 1 1 0 000 2zm9.364-.636A9 9 0 113.636 3.636a9 9 0 0117.728 17.728z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 003.636 3.636m14.728 14.728L3.636 3.636" />
              </svg>
            ) : (
              <AlertTriangle className="h-10 w-10 text-orange-600" />
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-foreground">
              {isCrossTenant 
                ? 'Acceso No Autorizado' 
                : isNotFound
                  ? 'Préstamo No Encontrado'
                  : 'Error de Conexión'}
            </h2>
            <p className="text-muted-foreground font-medium leading-relaxed">
              {errorInfo?.message || 'El préstamo solicitado no existe o no tienes permisos para verlo.'}
            </p>
          </div>

          {/* Badge de seguridad para cross-tenant */}
          {isCrossTenant && (
            <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-2.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest">
                Aislamiento de datos activo
              </span>
            </div>
          )}

          {/* Acciones */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link href="/admin/loans">
              <Button className="rounded-2xl h-12 px-6 font-bold">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ir a Mis Préstamos
              </Button>
            </Link>
            <Button 
              variant="outline" 
              className="rounded-2xl h-12 px-6 font-bold"
              onClick={() => {
                setErrorInfo(null);
                fetchLoanDetails();
              }}
            >
              Reintentar
            </Button>
          </div>

          {/* ID técnico */}
          <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
            REF: {loanId.substring(0, 12)}… • {errorInfo?.code || 'NO_DATA'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header - Optimized for PWA/Mobile */}
      <div className="flex flex-col gap-4">
        {/* Superior: Botón Volver e Info Básica */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <Link href="/admin/loans">
              <Button variant="outline" size="icon" className="h-10 w-10 shrink-0 rounded-xl">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-xl md:text-3xl font-extrabold text-primary truncate">
                  {loan.loanNumber}
                </h1>
                <Badge className={cn('text-[10px] px-2 h-5 rounded-full border-0 uppercase font-black shrink-0', statusConfig[loan.status]?.color || 'bg-gray-100 text-gray-700')}>
                  {statusConfig[loan.status]?.label || loan.status}
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground font-medium">
                {loan.loanType && (loanTypeConfig[loan.loanType as keyof typeof loanTypeConfig] || loan.loanType)} • {loan.client ? `${loan.client.firstName} ${loan.client.lastName}` : 'Cargando cliente...'}
              </p>
            </div>
          </div>

          {/* Acciones de Préstamo */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 sm:flex-none h-11 rounded-xl font-bold bg-white dark:bg-gray-900 border-blue-200 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
              onClick={() => setIsStatementModalOpen(true)}
            >
              <FileText className="h-4 w-4 mr-2" />
              <span className="sm:inline">Estado de Cuenta</span>
            </Button>
            {userRole !== 'CLIENTE' && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 sm:flex-none h-11 rounded-xl font-bold bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-600 hover:text-white transition-all shadow-sm"
                  onClick={() => setIsRefinanceModalOpen(true)}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Renovar / Refinanciar
                </Button>
                <Link href={`/admin/loans/${loan.id}/edit`} className="flex-1 sm:flex-none">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    className="w-full h-11 rounded-xl font-bold bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-700 transition-all shadow-sm"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Monto Original</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(loan.principalAmount)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CreditCard className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Saldo Pendiente</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(loan.balanceRemaining)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Pago Mensual</p>
                <p className="text-2xl font-bold text-foreground">
                  {formatCurrency(loan.monthlyPayment)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Progreso</p>
                <p className="text-2xl font-bold text-foreground">
                  {calculateProgress().toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="payments">Pagos ({loan.payments.length})</TabsTrigger>
          <TabsTrigger value="schedule">Plan de Pagos</TabsTrigger>
          <TabsTrigger value="client">Cliente</TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Información del Préstamo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Número de Préstamo</Label>
                  <p className="text-lg font-semibold">{loan.loanNumber}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tipo de Préstamo</Label>
                  <p className="text-lg font-semibold">{loanTypeConfig[loan.loanType as keyof typeof loanTypeConfig]}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Método de Cálculo</Label>
                  <p className="text-lg font-semibold">
                    {loan.loanCalculationType
                      ? calculationTypeConfig[loan.loanCalculationType as keyof typeof calculationTypeConfig]
                      : calculationTypeConfig.INTERES}
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                  <div className="mt-1">
                    <Badge className={statusConfig[loan.status]?.color || 'bg-gray-100 text-gray-700'}>
                      {statusConfig[loan.status]?.label || loan.status}
                    </Badge>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Monto Principal</Label>
                  <p className="text-lg font-semibold">{formatCurrency(loan.principalAmount)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Saldo Restante</Label>
                  <p className="text-lg font-semibold">{formatCurrency(loan.balanceRemaining)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Pago Mensual</Label>
                  <p className="text-lg font-semibold">{formatCurrency(loan.monthlyPayment)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Plazo</Label>
                  <p className="text-lg font-semibold">{loan.termMonths} meses</p>
                </div>
                {/* Mostrar Interés Semanal si aplica */}
                {loan.loanCalculationType === 'INTERES_SEMANAL' && loan.weeklyInterestAmount ? (
                  <>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Interés Semanal
                      </Label>
                      <p className="text-lg font-semibold">
                        {formatCurrency(loan.weeklyInterestAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {((loan.weeklyInterestAmount / loan.principalAmount) * 100).toFixed(2)}% del monto prestado
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Tasa Efectiva Total
                      </Label>
                      <p className="text-lg font-semibold">
                        {(loan.interestRate * 100).toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Sobre el plazo completo
                      </p>
                    </div>
                  </>
                ) : (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      {loan.loanCalculationType === 'TARIFA_FIJA' ? 'Tasa Efectiva' : 'Tasa de Interés'}
                    </Label>
                    <p className="text-lg font-semibold">
                      {(loan.interestRate * 100).toFixed(2)}% anual
                      {loan.loanCalculationType === 'TARIFA_FIJA' && (
                        <span className="text-sm text-muted-foreground ml-2">(calculada)</span>
                      )}
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha de Inicio</Label>
                  <p className="text-lg font-semibold">{formatDate(loan.startDate)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha de Fin</Label>
                  <p className="text-lg font-semibold">{formatDate(loan.endDate)}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Fecha de Creación</Label>
                  <p className="text-lg font-semibold">{formatDate(loan.createdAt)}</p>
                </div>
              </div>

              {/* Sección de Desembolso */}
              {(loan.insuranceAmount || loan.disbursementFee || loan.disbursedAmount) && (
                <>
                  <Separator className="my-6" />
                  <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase text-blue-600 tracking-wider">Detalle de Desembolso</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-blue-50/40 p-5 rounded-2xl border border-blue-100 flex-wrap">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Seguro Deducido</Label>
                        <p className="font-bold text-gray-900 text-lg">{formatCurrency(loan.insuranceAmount || 0)}</p>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-bold text-muted-foreground uppercase">Comisión / Cobro de Apertura</Label>
                        <p className="font-bold text-gray-900 text-lg">{formatCurrency(loan.disbursementFee || 0)}</p>
                      </div>
                      <div className="space-y-1 bg-blue-100/50 p-3 rounded-xl border border-blue-200">
                        <Label className="text-[10px] font-black text-blue-700 uppercase tracking-tight">Monto Neto Desembolsado</Label>
                        <p className="text-2xl font-black text-blue-800 leading-none mt-1">
                          {formatCurrency(loan.disbursedAmount || (loan.principalAmount - (loan.insuranceAmount || 0) - (loan.disbursementFee || 0)))}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              )}


            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Historial de Pagos</CardTitle>
              {userRole !== 'CLIENTE' && (
                <Button size="sm" asChild>
                  <Link href={`/admin/payments/new?loanId=${loan.id}`}>
                    <Plus className="h-4 w-4 mr-2" />
                    Registrar Pago
                  </Link>
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {loan.payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No hay pagos registrados</h3>
                  <p className="text-muted-foreground">Los pagos aparecerán aquí una vez que sean registrados.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {loan.payments.map((payment) => (
                    <div key={payment.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-lg">{formatCurrency(payment.amount)}</span>
                          <Badge className={cn('text-[10px] uppercase font-bold px-2 rounded-full', paymentStatusConfig[payment.status as keyof typeof paymentStatusConfig]?.color)}>
                            {paymentStatusConfig[payment.status as keyof typeof paymentStatusConfig]?.label}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {formatDatetime(payment.paymentDate)} • {payment.paymentMethod}
                        </p>
                        {payment.reference && (
                          <p className="text-xs font-medium text-primary">Folio: {payment.reference}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 sm:flex-none shadow-sm h-9 rounded-lg"
                          onClick={() => handlePaymentAction(payment, 'view')}
                        >
                          <Eye className="h-4 w-4 mr-1 text-gray-500" />
                          <span className="text-xs">Ver</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1 sm:flex-none shadow-sm h-9 rounded-lg"
                          onClick={() => handlePaymentAction(payment, 'download')}
                        >
                          <Download className="h-4 w-4 mr-1 text-gray-500" />
                          <span className="text-xs">Bajar</span>
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <AmortizationSchedule loanId={loan.id} />
        </TabsContent>

        <TabsContent value="client" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Nombre Completo</Label>
                  <p className="text-lg font-semibold">{loan.client?.firstName || 'N/A'} {loan.client?.lastName || ''}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-lg font-semibold">{loan.client?.email || 'N/A'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                  <p className="text-lg font-semibold">{loan.client?.phone || 'N/A'}</p>
                </div>
                {loan.client.monthlyIncome && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Ingresos Mensuales</Label>
                    <p className="text-lg font-semibold">{formatCurrency(loan.client.monthlyIncome)}</p>
                  </div>
                )}
                {loan.client.creditScore && (
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">Puntaje Crediticio</Label>
                    <p className="text-lg font-semibold">{loan.client.creditScore}</p>
                  </div>
                )}
              </div>

              <div className="flex justify-end">
                <Button variant="outline" asChild>
                  <Link href={`/admin/clients/${loan.client?.id || ''}`}>
                    Ver Perfil Completo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <LoanStatementModal
        isOpen={isStatementModalOpen}
        onOpenChange={setIsStatementModalOpen}
        loan={loan}
      />
      
      <RefinanceModal
        isOpen={isRefinanceModalOpen}
        onOpenChange={setIsRefinanceModalOpen}
        loan={loan as any}
        onSuccess={fetchLoanDetails}
      />
    </div>
  );
}
