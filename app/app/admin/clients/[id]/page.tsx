
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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin/clients">
              <Button variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
            </Link>
            
            {/* Imagen de perfil del cliente */}
            <ClientProfileImage
              clientId={client.id}
              currentImage={client.profileImage}
              clientName={`${client.firstName} ${client.lastName}`}
              editable={false}
              size="lg"
            />
            
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
                {client.firstName} {client.lastName}
              </h1>
              <div className="flex items-center gap-4 mt-2">
                <Badge variant={getStatusVariant(client.status) as any}>
                  {client.status}
                </Badge>
                {client.asesor && (
                  <p className="text-gray-600 dark:text-gray-300">
                    Asesor: {client.asesor.firstName} {client.asesor.lastName}
                  </p>
                )}
              </div>
            </div>
          </div>
          <Link href={`/admin/clients/${client.id}/edit`}>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs del cliente */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Préstamos Activos</h3>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{totalLoans}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Prestado</h3>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                notation: 'compact'
              }).format(totalBorrowed)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Saldo Pendiente</h3>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold text-orange-600">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                notation: 'compact'
              }).format(totalBalance)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Score Crediticio</h3>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{client.creditScore || 'N/A'}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="info" className="space-y-6">
        <TabsList>
          <TabsTrigger value="info">Información</TabsTrigger>
          <TabsTrigger value="references">Referencias</TabsTrigger>
          <TabsTrigger value="loans">Préstamos</TabsTrigger>
          <TabsTrigger value="applications">Solicitudes</TabsTrigger>
          <TabsTrigger value="activity">Actividad</TabsTrigger>
        </TabsList>

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
          <Card>
            <CardHeader>
              <CardTitle>Préstamos del Cliente</CardTitle>
              <CardDescription>
                Historial completo de préstamos activos y pasados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {client.loans.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Este cliente no tiene préstamos registrados</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Número de Préstamo</TableHead>
                        <TableHead>Monto Principal</TableHead>
                        <TableHead>Saldo Restante</TableHead>
                        <TableHead>Tasa de Interés</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha de Inicio</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.loans.map((loan) => (
                        <TableRow key={loan.id}>
                          <TableCell className="font-mono">
                            <Link 
                              href={`/admin/loans/${loan.id}`}
                              className="text-blue-600 hover:underline"
                            >
                              {loan.loanNumber}
                            </Link>
                          </TableCell>
                          <TableCell className="font-semibold">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN'
                            }).format(loan.principalAmount)}
                          </TableCell>
                          <TableCell className="font-semibold text-orange-600">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN'
                            }).format(loan.balanceRemaining)}
                          </TableCell>
                          <TableCell>{loan.interestRate}%</TableCell>
                          <TableCell>
                            <Badge variant="outline">{loan.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(loan.startDate).toLocaleDateString('es-MX')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="applications">
          <Card>
            <CardHeader>
              <CardTitle>Solicitudes de Crédito</CardTitle>
              <CardDescription>
                Historial de solicitudes de crédito del cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              {client.creditApplications.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Este cliente no tiene solicitudes de crédito</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Monto Solicitado</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Fecha de Solicitud</TableHead>
                        <TableHead>Fecha de Revisión</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {client.creditApplications.map((application) => (
                        <TableRow key={application.id}>
                          <TableCell className="font-semibold">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN'
                            }).format(application.requestedAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{application.status}</Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(application.createdAt).toLocaleDateString('es-MX')}
                          </TableCell>
                          <TableCell>
                            {application.reviewedAt 
                              ? new Date(application.reviewedAt).toLocaleDateString('es-MX')
                              : 'Pendiente'
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Reciente</CardTitle>
              <CardDescription>
                Historial de actividades y transacciones del cliente
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  El historial de actividades se implementará próximamente
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
