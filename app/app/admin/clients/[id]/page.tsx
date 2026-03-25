
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  ArrowLeft, 
  Edit, 
  Phone, 
  Mail, 
  MapPin, 
  Building,
  CreditCard,
  TrendingUp,
  DollarSign,
  Calendar,
  FileText,
  User,
  Users,
  UserCheck,
  Package
} from 'lucide-react';
import { toast } from 'sonner';
import { PersonalReferencesForm } from '@/components/clients/personal-references-form';
import { ClientProfileImage } from '@/components/clients/client-profile-image';
import { GPSCheckIn } from '@/components/collections/check-in-button';

interface ClientData {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profileImage?: string | null;
  dateOfBirth: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  monthlyIncome: number;
  creditScore: number;
  status: string;
  employmentType: string;
  employerName: string;
  workAddress: string;
  yearsEmployed: number;
  bankName: string;
  accountNumber: string;
  createdAt: string;
  asesor?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  loans: Array<{
    id: string;
    loanNumber: string;
    principalAmount: number;
    balanceRemaining: number;
    interestRate: number;
    status: string;
    startDate: string;
    endDate: string;
    payments: Array<{
      id: string;
      amount: number;
      paymentDate: string;
      status: string;
    }>;
  }>;
  creditApplications: Array<{
    id: string;
    requestedAmount: number;
    status: string;
    createdAt: string;
    reviewedAt: string;
  }>;
  guarantor?: {
    id: string;
    fullName: string;
    address: string;
    phone: string;
    relationship: string;
  };
  collaterals?: Array<{
    id: string;
    description: string;
    createdAt: string;
  }>;
  auditLogs?: Array<{
    id: string;
    action: string;
    resource?: string;
    details?: string;
    timestamp: string;
    userEmail?: string;
  }>;
}

export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [client, setClient] = useState<ClientData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params?.id) {
      fetchClientData(params.id as string);
    }
  }, [params?.id]);

  const fetchClientData = async (clientId: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (!response.ok) throw new Error('Error al cargar cliente');

      const data = await response.json();
      console.log('Client data loaded:', data);
      console.log('Guarantor:', data.guarantor);
      console.log('Collaterals:', data.collaterals);
      setClient(data);
    } catch (error) {
      console.error('Error fetching client:', error);
      toast.error('Error al cargar los datos del cliente');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div>
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Cliente no encontrado
          </h2>
          <Link href="/admin/clients">
            <Button>Volver a la lista</Button>
          </Link>
        </div>
      </div>
    );
  }

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'default';
      case 'INACTIVE':
        return 'secondary';
      case 'SUSPENDED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const totalLoans = client.loans.length;
  const totalBorrowed = client.loans.reduce((sum, loan) => sum + loan.principalAmount, 0);
  const totalBalance = client.loans.reduce((sum, loan) => sum + loan.balanceRemaining, 0);
  const totalPaid = totalBorrowed - totalBalance;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link href="/admin/clients">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-1" />
                Volver
              </Button>
            </Link>
            <ClientProfileImage
              clientId={client.id}
              currentImage={client.profileImage}
              clientName={`${client.firstName} ${client.lastName}`}
              editable={false}
              size="lg"
            />
            <div>
              <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                {client.firstName} {client.lastName}
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <Badge variant={getStatusVariant(client.status) as any} className="text-xs">
                  {client.status}
                </Badge>
                {client.asesor && (
                  <span className="text-xs text-gray-500">
                    Asesor: {client.asesor.firstName} {client.asesor.lastName}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <GPSCheckIn clientId={client.id} />
            <Link href={`/admin/clients/${client.id}/edit`}>
              <Button variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-1" />
                Editar
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* KPIs — 2-col en móvil */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-muted-foreground">Préstamos</h3>
              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{totalLoans}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-muted-foreground">Total Prestado</h3>
              <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact' }).format(totalBorrowed)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-muted-foreground">Saldo Pendiente</h3>
              <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact' }).format(totalBalance)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-medium text-muted-foreground">Score</h3>
              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{client.creditScore || 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        {/* TabsList con scroll horizontal para PWA */}
        <div className="overflow-x-auto -mx-1 px-1">
          <TabsList className="inline-flex w-max min-w-full h-10 whitespace-nowrap">
            <TabsTrigger value="info" className="text-xs px-3">Información</TabsTrigger>
            <TabsTrigger value="references" className="text-xs px-3">Referencias</TabsTrigger>
            <TabsTrigger value="loans" className="text-xs px-3">
              Préstamos
              {client.loans.length > 0 && (
                <span className="ml-1 bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">{client.loans.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="applications" className="text-xs px-3">
              Solicitudes
              {client.creditApplications.length > 0 && (
                <span className="ml-1 bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded-full font-bold">{client.creditApplications.length}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs px-3">Actividad</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="info">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Información Personal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información Personal
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span>{client.email || 'Sin email'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span>{client.phone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {client.dateOfBirth 
                      ? new Date(client.dateOfBirth).toLocaleDateString('es-MX')
                      : 'Sin fecha de nacimiento'
                    }
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <div>
                    <p>{client.address || 'Sin dirección'}</p>
                    {(client.city || client.state) && (
                      <p className="text-sm text-muted-foreground">
                        {client.city} {client.state} {client.postalCode}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Información Financiera */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Información Financiera
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ingreso Mensual:</span>
                  <span className="font-semibold">
                    {client.monthlyIncome 
                      ? new Intl.NumberFormat('es-MX', {
                          style: 'currency',
                          currency: 'MXN'
                        }).format(client.monthlyIncome)
                      : 'No registrado'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Score Crediticio:</span>
                  <span className="font-semibold">{client.creditScore || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Banco Principal:</span>
                  <span className="font-semibold">{client.bankName || 'No registrado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cuenta:</span>
                  <span className="font-mono text-sm">{client.accountNumber || 'N/A'}</span>
                </div>
              </CardContent>
            </Card>

            {/* Información Laboral */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5" />
                  Información Laboral
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tipo de Empleo:</span>
                  <span className="font-semibold">{client.employmentType || 'No registrado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Empleador:</span>
                  <span className="font-semibold">{client.employerName || 'No registrado'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Años de Experiencia:</span>
                  <span className="font-semibold">{client.yearsEmployed || 0} años</span>
                </div>
                {client.workAddress && (
                  <div className="flex items-start gap-2">
                    <span className="text-muted-foreground text-sm">Dirección:</span>
                    <span className="text-sm">{client.workAddress}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Información del Aval y Garantías */}
          <div className="grid gap-6 md:grid-cols-2 mt-6">
            {/* Aval */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserCheck className="h-5 w-5" />
                  Información del Aval
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.guarantor ? (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Nombre Completo:</span>
                      <span className="font-semibold">{client.guarantor.fullName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Teléfono:</span>
                      <span className="font-semibold">{client.guarantor.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Parentesco:</span>
                      <span className="font-semibold">
                        {client.guarantor.relationship === 'FAMILY' && 'Familiar'}
                        {client.guarantor.relationship === 'FRIEND' && 'Amigo'}
                        {client.guarantor.relationship === 'COWORKER' && 'Compañero de Trabajo'}
                        {client.guarantor.relationship === 'NEIGHBOR' && 'Vecino'}
                        {client.guarantor.relationship === 'OTHER' && 'Otro'}
                      </span>
                    </div>
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                      <div>
                        <p className="text-sm">{client.guarantor.address || 'Sin dirección'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <UserCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay información de aval registrada</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Garantías */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Garantías ({client.collaterals?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {client.collaterals && client.collaterals.length > 0 ? (
                  <div className="space-y-2">
                    {client.collaterals.map((collateral: any, index: number) => (
                      <div
                        key={collateral.id}
                        className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{collateral.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No hay garantías registradas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="references">
          <PersonalReferencesForm clientId={client.id} readonly={false} />
        </TabsContent>

        <TabsContent value="loans">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Préstamos del Cliente
              </h3>
              <Link href={`/admin/loans/new?clientId=${client.id}`}>
                <Button size="sm" variant="outline">
                  <CreditCard className="h-3.5 w-3.5 mr-1" />
                  Nuevo
                </Button>
              </Link>
            </div>

            {client.loans.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">Este cliente no tiene préstamos registrados</p>
                </CardContent>
              </Card>
            ) : (
              client.loans.map((loan) => {
                const pct = loan.principalAmount > 0
                  ? Math.round(((loan.principalAmount - loan.balanceRemaining) / loan.principalAmount) * 100)
                  : 0;
                const isActive = loan.status === 'ACTIVE';
                return (
                  <Card key={loan.id} className="border hover:shadow-md transition-all active:scale-[0.99]">
                    <CardContent className="p-4">
                      {/* Row 1: número + estado */}
                      <div className="flex items-center justify-between mb-3">
                        <Link href={`/admin/loans/${loan.id}`}>
                          <span className="font-bold text-primary text-sm hover:underline">{loan.loanNumber}</span>
                        </Link>
                        <Badge
                          className={`text-[10px] border-0 ${
                            isActive ? 'bg-green-100 text-green-700'
                            : loan.status === 'PAID_OFF' ? 'bg-gray-100 text-gray-600'
                            : 'bg-red-100 text-red-700'
                          }`}
                        >
                          {loan.status === 'ACTIVE' ? 'Activo' : loan.status === 'PAID_OFF' ? 'Liquidado' : loan.status}
                        </Badge>
                      </div>

                      {/* Row 2: montos en grid 2x2 */}
                      <div className="grid grid-cols-2 gap-3 mb-3 text-xs">
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                          <p className="text-gray-400 mb-0.5">Monto</p>
                          <p className="font-bold text-gray-900 dark:text-white">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(loan.principalAmount)}
                          </p>
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-2.5">
                          <p className="text-gray-400 mb-0.5">Saldo</p>
                          <p className="font-bold text-orange-600">
                            {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(loan.balanceRemaining)}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                          <p className="text-gray-400 mb-0.5">Inicio</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {new Date(loan.startDate).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                          <p className="text-gray-400 mb-0.5">Pagos</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{loan.payments.length} realizados</p>
                        </div>
                      </div>

                      {/* Barra de progreso */}
                      <div>
                        <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                          <span>Progreso de pago</span>
                          <span>{pct}% pagado</span>
                        </div>
                        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </TabsContent>

        <TabsContent value="applications">
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">Solicitudes de Crédito</h3>
            {client.creditApplications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground text-sm">Sin solicitudes de crédito</p>
                </CardContent>
              </Card>
            ) : (
              client.creditApplications.map((app) => (
                <Card key={app.id} className="border hover:shadow-md transition-all">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-lg text-gray-900 dark:text-white">
                        {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(app.requestedAmount)}
                      </span>
                      <Badge
                        className={`text-[10px] border-0 ${
                          app.status === 'APPROVED' ? 'bg-green-100 text-green-700'
                          : app.status === 'REJECTED' ? 'bg-red-100 text-red-700'
                          : app.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {app.status === 'APPROVED' ? 'Aprobada'
                          : app.status === 'REJECTED' ? 'Rechazada'
                          : app.status === 'PENDING' ? 'Pendiente'
                          : app.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Solicitada: {new Date(app.createdAt).toLocaleDateString('es-MX')}</span>
                      <span>{app.reviewedAt ? `Revisada: ${new Date(app.reviewedAt).toLocaleDateString('es-MX')}` : 'Sin revisar'}</span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="activity">
          <Card className="border-0 shadow-none bg-transparent">
            <CardContent className="p-0 pt-2">
              <div className="space-y-6 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-100 dark:before:bg-gray-800">
                {!client.auditLogs || client.auditLogs.length === 0 ? (
                  <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-2xl border border-dashed">
                    <Calendar className="h-10 w-10 mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 text-sm font-medium">No hay actividad reciente registrada</p>
                  </div>
                ) : (
                  client.auditLogs.map((log: any, idx: number) => {
                    const isLast = idx === client.auditLogs.length - 1;
                    const date = new Date(log.timestamp);
                    const timeStr = date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
                    const dateStr = date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
                    
                    // Icono basado en la acción
                    let ActionIcon = FileText;
                    let iconBg = 'bg-blue-100 text-blue-600';
                    
                    if (log.action.includes('PAYMENT')) {
                       ActionIcon = DollarSign;
                       iconBg = 'bg-green-100 text-green-600';
                    } else if (log.action.includes('LOGIN')) {
                       ActionIcon = UserCheck;
                       iconBg = 'bg-purple-100 text-purple-600';
                    } else if (log.action.includes('LOAN')) {
                       ActionIcon = CreditCard;
                       iconBg = 'bg-orange-100 text-orange-600';
                    }

                    return (
                      <div key={log.id} className="relative pl-10">
                        <div className={`absolute left-0 top-1 w-8 h-8 rounded-full ${iconBg} border-4 border-white dark:border-gray-950 flex items-center justify-center z-10 shadow-sm`}>
                          <ActionIcon className="h-3.5 w-3.5" />
                        </div>
                        
                        <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-tight">
                              {log.action.replace(/_/g, ' ')}
                            </h4>
                            <span className="text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full">
                              {dateStr}, {timeStr}
                            </span>
                          </div>
                          
                          <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                            {log.details || `Se registró una acción de ${log.action} en el sistema.`}
                          </p>
                          
                          {log.userEmail && (
                            <div className="mt-3 flex items-center gap-1.5 opacity-60">
                              <div className="w-4 h-4 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                                <User className="h-2 w-2 text-gray-500" />
                              </div>
                              <span className="text-[9px] font-medium text-gray-500">Realizado por: {log.userEmail}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
