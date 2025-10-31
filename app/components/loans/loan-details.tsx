
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
  AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface LoanDetail {
  id: string;
  loanNumber: string;
  loanType: string;
  principalAmount: number;
  balanceRemaining: number;
  termMonths: number;
  interestRate: number;
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

const statusConfig = {
  ACTIVE: { label: 'Activo', color: 'status-badge-active' },
  PAID_OFF: { label: 'Liquidado', color: 'status-badge-completed' },
  DEFAULTED: { label: 'En Mora', color: 'status-badge-failed' },
  CANCELLED: { label: 'Cancelado', color: 'status-badge-cancelled' }
};

const loanTypeConfig = {
  PERSONAL: 'Personal',
  BUSINESS: 'Empresarial',
  MORTGAGE: 'Hipotecario',
  AUTO: 'Automotriz',
  EDUCATION: 'Educativo'
};

const paymentStatusConfig = {
  COMPLETED: { label: 'Completado', color: 'status-badge-completed' },
  PENDING: { label: 'Pendiente', color: 'status-badge-pending' },
  FAILED: { label: 'Fallido', color: 'status-badge-failed' }
};

export function LoanDetails({ loanId, userRole }: LoanDetailsProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loan, setLoan] = useState<LoanDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLoanDetails();
  }, [loanId]);

  const fetchLoanDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/loans/${loanId}`);
      if (!response.ok) throw new Error('Error al cargar el préstamo');

      const data = await response.json();
      setLoan(data.loan);
    } catch (error) {
      console.error('Error fetching loan details:', error);
      toast.error('Error al cargar los detalles del préstamo');
      router.push('/admin/loans');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
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
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded" />
        <div className="h-96 bg-muted animate-pulse rounded" />
      </div>
    );
  }

  if (!loan) {
    return (
      <div className="text-center py-12">
        <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Préstamo no encontrado</h2>
        <p className="text-muted-foreground mb-4">El préstamo solicitado no existe o no tienes permisos para verlo.</p>
        <Link href="/admin/loans">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver a Préstamos
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/loans">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{loan.loanNumber}</h1>
            <p className="text-muted-foreground">
              {loanTypeConfig[loan.loanType as keyof typeof loanTypeConfig]} • {loan.client.firstName} {loan.client.lastName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge className={statusConfig[loan.status as keyof typeof statusConfig]?.color}>
            {statusConfig[loan.status as keyof typeof statusConfig]?.label}
          </Badge>
          {userRole !== 'CLIENTE' && (
            <Button variant="outline" size="sm" asChild>
              <Link href={`/admin/loans/${loan.id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Editar
              </Link>
            </Button>
          )}
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
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList>
          <TabsTrigger value="details">Detalles</TabsTrigger>
          <TabsTrigger value="payments">Pagos ({loan.payments.length})</TabsTrigger>
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
                  <Label className="text-sm font-medium text-muted-foreground">Estado</Label>
                  <div className="mt-1">
                    <Badge className={statusConfig[loan.status as keyof typeof statusConfig]?.color}>
                      {statusConfig[loan.status as keyof typeof statusConfig]?.label}
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
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tasa de Interés</Label>
                  <p className="text-lg font-semibold">{(loan.interestRate * 100).toFixed(2)}% anual</p>
                </div>
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
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{formatCurrency(payment.amount)}</span>
                          <Badge className={paymentStatusConfig[payment.status as keyof typeof paymentStatusConfig]?.color}>
                            {paymentStatusConfig[payment.status as keyof typeof paymentStatusConfig]?.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDatetime(payment.paymentDate)} • {payment.paymentMethod}
                        </p>
                        {payment.reference && (
                          <p className="text-xs text-muted-foreground">Ref: {payment.reference}</p>
                        )}
                        {payment.notes && (
                          <p className="text-xs text-muted-foreground">{payment.notes}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
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
                  <p className="text-lg font-semibold">{loan.client.firstName} {loan.client.lastName}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                  <p className="text-lg font-semibold">{loan.client.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Teléfono</Label>
                  <p className="text-lg font-semibold">{loan.client.phone}</p>
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
                  <Link href={`/admin/clients/${loan.client.id}`}>
                    Ver Perfil Completo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
