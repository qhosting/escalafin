
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  CreditCard,
  DollarSign,
  Calendar,
  User,
  Building2,
  Phone,
  Mail,
  MapPin,
  Briefcase,
  TrendingUp,
  FileText,
  Edit,
  Edit,
  ArrowLeft,
  MessageCircle
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AmortizationSchedule } from './amortization-schedule';

interface LoanDetailProps {
  loanId: string;
  userRole?: string;
}

interface LoanData {
  id: string;
  loanNumber: string;
  loanType: string;
  principalAmount: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalAmount: number;
  balanceRemaining: number;
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
    address?: string;
    city?: string;
    monthlyIncome?: number;
    employmentType?: string;
    employerName?: string;
  };
  creditApplication?: {
    id: string;
    loanType: string;
    requestedAmount: number;
    purpose: string;
    status: string;
    createdAt: string;
  };
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    status: string;
    reference?: string;
    processedByUser?: {
      firstName: string;
      lastName: string;
    };
  }>;
}

const statusConfig = {
  ACTIVE: { label: 'Activo', color: 'bg-green-100 text-green-800' },
  PAID_OFF: { label: 'Liquidado', color: 'bg-blue-100 text-blue-800' },
  DEFAULTED: { label: 'En Mora', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
};

const loanTypeConfig = {
  PERSONAL: 'Personal',
  BUSINESS: 'Empresarial',
  MORTGAGE: 'Hipotecario',
  AUTO: 'Automotriz',
  EDUCATION: 'Educativo'
};

const paymentMethodConfig = {
  CASH: 'Efectivo',
  BANK_TRANSFER: 'Transferencia',
  CHECK: 'Cheque',
  DEBIT_CARD: 'Tarjeta de Débito',
  CREDIT_CARD: 'Tarjeta de Crédito',
  ONLINE: 'Pago en Línea'
};

const paymentStatusConfig = {
  PENDING: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
  COMPLETED: { label: 'Completado', color: 'bg-green-100 text-green-800' },
  FAILED: { label: 'Fallido', color: 'bg-red-100 text-red-800' },
  CANCELLED: { label: 'Cancelado', color: 'bg-gray-100 text-gray-800' }
};

export function LoanDetail({ loanId, userRole }: LoanDetailProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [loan, setLoan] = useState<LoanData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchLoan = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/loans/${loanId}`);
      if (!response.ok) throw new Error('Error al cargar el préstamo');

      const data = await response.json();
      setLoan(data);
    } catch (error) {
      console.error('Error fetching loan:', error);
      toast.error('Error al cargar el préstamo');
      router.push(`/${userRole?.toLowerCase() || 'admin'}/loans`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoan();
  }, [loanId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
  };

  const calculateProgress = () => {
    if (!loan) return 0;
    const paid = loan.principalAmount - loan.balanceRemaining;
    return Math.round((paid / loan.principalAmount) * 100);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-gray-200 animate-pulse rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-32 bg-gray-200 animate-pulse rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Préstamo no encontrado</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => router.push(`/${userRole?.toLowerCase() || 'admin'}/loans`)}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{loan.loanNumber}</h1>
            <p className="text-gray-600">
              {loanTypeConfig[loan.loanType as keyof typeof loanTypeConfig] || loan.loanType}
            </p>
          </div>
          <Badge className={statusConfig[loan.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
            {statusConfig[loan.status as keyof typeof statusConfig]?.label || loan.status}
          </Badge>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => window.open(`/api/loans/${loanId}/statement`, '_blank')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Estado de Cuenta
          </Button>

          {userRole === 'CLIENTE' && (
            <Button
              onClick={() => {
                // Número de soporte por defecto o configurable
                const supportPhone = '521234567890';
                const message = `Hola, quisiera solicitar una prórroga para mi préstamo ${loan.loanNumber}.`;
                const url = `https://wa.me/${supportPhone}?text=${encodeURIComponent(message)}`;
                window.open(url, '_blank');
              }}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Solicitar Prórroga
            </Button>
          )}

          {userRole !== 'CLIENTE' && (
            <Link href={`/${userRole?.toLowerCase() || 'admin'}/loans/${loan.id}/edit`}>
              <Button>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Resumen del Préstamo */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Monto Original</p>
                <p className="text-lg font-semibold">{formatCurrency(loan.principalAmount)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Saldo Restante</p>
                <p className="text-lg font-semibold">{formatCurrency(loan.balanceRemaining)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pago Mensual</p>
                <p className="text-lg font-semibold">{formatCurrency(loan.monthlyPayment)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Progreso</p>
                <p className="text-lg font-semibold">{calculateProgress()}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs con información detallada */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="client">Cliente</TabsTrigger>
          <TabsTrigger value="schedule">Pagos</TabsTrigger>
          <TabsTrigger value="history">Historial</TabsTrigger>
        </TabsList>

        {/* Detalles del Préstamo */}
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Información Financiera
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Tasa de Interés</p>
                    <p className="font-medium">{loan.interestRate}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Plazo</p>
                    <p className="font-medium">{loan.termMonths} meses</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total a Pagar</p>
                    <p className="font-medium">{formatCurrency(loan.totalAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Intereses Totales</p>
                    <p className="font-medium">{formatCurrency(loan.totalAmount - loan.principalAmount)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fechas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Fecha de Inicio</p>
                  <p className="font-medium">{formatDate(loan.startDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Fecha de Vencimiento</p>
                  <p className="font-medium">{formatDate(loan.endDate)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Creado el</p>
                  <p className="font-medium">{formatDateTime(loan.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Solicitud de Crédito Relacionada */}
          {loan.creditApplication && (
            <Card>
              <CardHeader>
                <CardTitle>Solicitud de Crédito Relacionada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Monto Solicitado</p>
                    <p className="font-medium">{formatCurrency(loan.creditApplication.requestedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Propósito</p>
                    <p className="font-medium">{loan.creditApplication.purpose}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Fecha de Solicitud</p>
                    <p className="font-medium">{formatDate(loan.creditApplication.createdAt)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Información del Cliente */}
        <TabsContent value="client" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Nombre Completo</p>
                    <p className="font-medium">{loan.client.firstName} {loan.client.lastName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{loan.client.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Teléfono</p>
                    <p className="font-medium">{loan.client.phone}</p>
                  </div>
                </div>
                <div className="space-y-4">
                  {loan.client.address && (
                    <div>
                      <p className="text-sm text-gray-600">Dirección</p>
                      <p className="font-medium">{loan.client.address}</p>
                      {loan.client.city && <p className="text-sm text-gray-500">{loan.client.city}</p>}
                    </div>
                  )}
                  {loan.client.monthlyIncome && (
                    <div>
                      <p className="text-sm text-gray-600">Ingresos Mensuales</p>
                      <p className="font-medium">{formatCurrency(loan.client.monthlyIncome)}</p>
                    </div>
                  )}
                  {loan.client.employerName && (
                    <div>
                      <p className="text-sm text-gray-600">Empleador</p>
                      <p className="font-medium">{loan.client.employerName}</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tabla de Amortización */}
        <TabsContent value="schedule">
          <AmortizationSchedule loanId={loan.id} />
        </TabsContent>

        {/* Historial de Pagos */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Pagos</CardTitle>
            </CardHeader>
            <CardContent>
              {loan.payments.length > 0 ? (
                <div className="space-y-4">
                  {loan.payments.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <p className="font-medium">{formatCurrency(payment.amount)}</p>
                        <p className="text-sm text-gray-600">{formatDateTime(payment.paymentDate)}</p>
                        <p className="text-xs text-gray-500">
                          {paymentMethodConfig[payment.paymentMethod as keyof typeof paymentMethodConfig] || payment.paymentMethod}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className={paymentStatusConfig[payment.status as keyof typeof paymentStatusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                          {paymentStatusConfig[payment.status as keyof typeof paymentStatusConfig]?.label || payment.status}
                        </Badge>
                        {payment.reference && (
                          <p className="text-xs text-gray-500 mt-1">Ref: {payment.reference}</p>
                        )}
                        {payment.processedByUser && (
                          <p className="text-xs text-gray-500">
                            Por: {payment.processedByUser.firstName} {payment.processedByUser.lastName}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">
                  No hay pagos registrados para este préstamo
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div >
  );
}
