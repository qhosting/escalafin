
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Users, 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  TrendingUp,
  UserCheck,
  UserX,
  Clock,
  DollarSign,
  Database,
  Upload
} from 'lucide-react';
import { toast } from 'sonner';
import { PageSkeleton } from '@/components/ui/page-skeleton';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  monthlyIncome: number;
  creditScore: number;
  createdAt: string;
  asesor?: {
    firstName: string;
    lastName: string;
  };
  loans: Array<{
    id: string;
    loanNumber: string;
    principalAmount: number;
    balanceRemaining: number;
    status: string;
  }>;
  creditApplications: Array<{
    id: string;
    status: string;
    requestedAmount: number;
  }>;
}

interface ClientsStats {
  totalClients: number;
  activeClients: number;
  totalLoans: number;
  totalPortfolio: number;
  avgCreditScore: number;
}

export default function ClientsPage() {
  const { data: session, status } = useSession() || {};
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientsStats>({
    totalClients: 0,
    activeClients: 0,
    totalLoans: 0,
    totalPortfolio: 0,
    avgCreditScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 500);
    return () => clearTimeout(timer);
  }, [currentPage, statusFilter, searchTerm]);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (statusFilter && statusFilter !== 'all') {
        params.append('status', statusFilter);
      }

      if (searchTerm) {
        params.append('search', searchTerm);
      }

      const response = await fetch(`/api/clients?${params}`);
      if (!response.ok) throw new Error('Error al cargar clientes');

      const data = await response.json();
      setClients(data.clients || []);
      setTotalPages(data.pagination?.totalPages || 1);

      // Calcular estadísticas
      const totalClients = data.pagination?.totalCount || 0;
      const activeClients = data.clients?.filter((c: Client) => c.status === 'ACTIVE').length || 0;
      const totalLoans = data.clients?.reduce((acc: number, c: Client) => acc + c.loans.length, 0) || 0;
      const totalPortfolio = data.clients?.reduce((acc: number, c: Client) => 
        acc + c.loans.reduce((loanAcc: number, loan: any) => loanAcc + (loan.balanceRemaining || 0), 0), 0) || 0;
      const avgCreditScore = data.clients?.length > 0 ? 
        data.clients.reduce((acc: number, c: Client) => acc + (c.creditScore || 0), 0) / data.clients.length : 0;

      setStats({
        totalClients,
        activeClients,
        totalLoans,
        totalPortfolio: data.stats?.totalPortfolio || 0,
        avgCreditScore: Math.round(avgCreditScore)
      });

    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (client.firstName?.toLowerCase() || '').includes(searchLower) ||
      (client.lastName?.toLowerCase() || '').includes(searchLower) ||
      (client.email?.toLowerCase() || '').includes(searchLower) ||
      (client.phone || '').includes(searchTerm)
    );
  });

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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <UserCheck className="h-4 w-4" />;
      case 'INACTIVE':
        return <Clock className="h-4 w-4" />;
      case 'SUSPENDED':
        return <UserX className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  if (loading && clients.length === 0) {
    return <PageSkeleton />;
  }

  return (
    <div className="pb-20 md:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
            Gestión de Clientes
          </h1>
          <p className="hidden sm:block text-sm text-gray-500 mt-1">
            Administra todos los clientes y su información financiera
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') && (
            <Link href="/admin/clients/migrate">
              <Button size="sm" variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-300 dark:hover:bg-blue-950/50">
                <Database className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">Migrar</span>
                <span className="sm:hidden">Migrar</span>
              </Button>
            </Link>
          )}
          <Link href="/admin/clients/new" className="hidden sm:inline-block">
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white font-bold px-4">
              <Plus className="h-4 w-4 mr-1" />
              Nuevo Cliente
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs — 2-col en móvil */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <Card className="border border-blue-100 dark:border-blue-900/50 bg-blue-50/50 dark:bg-blue-900/10 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] uppercase font-bold text-blue-600 tracking-wider">Total</h3>
              <Users className="h-3.5 w-3.5 text-blue-500" />
            </div>
            <div className="text-xl font-black text-blue-900 dark:text-blue-100">{stats.totalClients}</div>
          </CardContent>
        </Card>

        <Card className="border border-green-100 dark:border-green-900/50 bg-green-50/50 dark:bg-green-900/10 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] uppercase font-bold text-green-600 tracking-wider">Activos</h3>
              <UserCheck className="h-3.5 w-3.5 text-green-500" />
            </div>
            <div className="text-xl font-black text-green-900 dark:text-green-100">{stats.activeClients}</div>
          </CardContent>
        </Card>

        <Card className="border border-purple-100 dark:border-purple-900/50 bg-purple-50/50 dark:bg-purple-900/10 hidden sm:block shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] uppercase font-bold text-purple-600 tracking-wider">Préstamos</h3>
              <TrendingUp className="h-3.5 w-3.5 text-purple-500" />
            </div>
            <div className="text-xl font-black text-purple-900 dark:text-purple-100">{stats.totalLoans}</div>
          </CardContent>
        </Card>

        <Card className="border border-orange-100 dark:border-orange-900/50 bg-orange-50/50 dark:bg-orange-900/10 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] uppercase font-bold text-orange-600 tracking-wider">Cartera</h3>
              <DollarSign className="h-3.5 w-3.5 text-orange-500" />
            </div>
            <div className="text-xl font-black text-orange-900 dark:text-orange-100">
              {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact' }).format(stats.totalPortfolio)}
            </div>
          </CardContent>
        </Card>

        <Card className="border border-indigo-100 dark:border-indigo-900/50 bg-indigo-50/50 dark:bg-indigo-900/10 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Score</h3>
              <TrendingUp className="h-3.5 w-3.5 text-indigo-500" />
            </div>
            <div className="text-xl font-black text-indigo-900 dark:text-indigo-100">{stats.avgCreditScore}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros y búsqueda */}
      {/* Filtros y búsqueda — Compactos */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 rounded-xl"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48 h-11 bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 rounded-xl">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los estados</SelectItem>
            <SelectItem value="ACTIVE">Activo</SelectItem>
            <SelectItem value="INACTIVE">Inactivo</SelectItem>
            <SelectItem value="SUSPENDED">Suspendido</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabla de clientes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
          <CardDescription>
            {filteredClients.length} de {clients.length} clientes
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-xl gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="h-5 w-48 bg-gray-100 animate-pulse rounded" />
                    <div className="h-4 w-32 bg-gray-50 animate-pulse rounded" />
                  </div>
                  <div className="h-10 w-32 bg-gray-100 animate-pulse rounded-xl" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* View Desktop: Table */}
              <div className="hidden md:block border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Teléfono</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead>Asesor</TableHead>
                      <TableHead>Préstamos</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">
                              {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => (
                        <TableRow key={client.id}>
                          <TableCell>
                            <div className="font-medium">
                              {client.firstName} {client.lastName}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {client.email || 'N/A'}
                          </TableCell>
                          <TableCell>{client.phone}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(client.status)}
                              <Badge variant={getStatusVariant(client.status) as any}>
                                {client.status}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.asesor ? (
                              <div className="text-sm">
                                {client.asesor.firstName} {client.asesor.lastName}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">Sin asignar</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {client.loans.length} préstamos
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="font-semibold">
                              {client.creditScore || 'N/A'}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Link href={`/admin/clients/${client.id}`}>
                                <Button variant="outline" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                              </Link>
                              <Link href={`/admin/clients/${client.id}/edit`}>
                                <Button variant="outline" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </Link>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* View Mobile: Tarjetas Premium */}
              <div className="md:hidden grid grid-cols-1 gap-4">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-12 bg-gray-50 dark:bg-gray-900 rounded-2xl">
                    <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500">
                      {searchTerm ? 'No se encontraron clientes' : 'No hay clientes registrados'}
                    </p>
                  </div>
                ) : (
                  filteredClients.map((client) => {
                    const firstName = client.firstName || '';
                    const lastName = client.lastName || '';
                    const initials = (firstName[0] || '') + (lastName[0] || '');
                    const hasActiveLoan = client.loans.some(l => l.status === 'ACTIVE');
                    return (
                      <Card key={client.id} className="relative overflow-hidden border-gray-100 dark:border-gray-800 shadow-sm active:scale-[0.98] transition-all">
                        {!client.loans.some(l => l.status === 'PAID_OFF') && hasActiveLoan && (
                          <div className="absolute top-0 right-0 w-12 h-12">
                             <div className="absolute top-[-2px] right-[-2px] p-1 pb-1 pr-1 bg-green-500 text-white rounded-bl-xl">
                               <UserCheck className="h-3 w-3" />
                             </div>
                          </div>
                        )}
                        
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3 mb-4">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 flex items-center justify-center font-black text-primary text-base shrink-0 shadow-inner">
                              {initials}
                            </div>
                            <div className="flex-1 min-w-0 pr-6">
                              <h3 className="font-bold text-gray-900 dark:text-white truncate">
                                {client.firstName} {client.lastName}
                              </h3>
                              <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                <Badge variant={getStatusVariant(client.status) as any} className="text-[9px] h-3.5 px-1 py-0 border-0">
                                  {client.status}
                                </Badge>
                                <span className="text-[11px] text-gray-400 font-medium">#{client.phone}</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100/50 dark:border-gray-700/50">
                              <p className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Asesor</p>
                              <p className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">
                                {client.asesor ? `${client.asesor.firstName}` : 'Sin Asesor'}
                              </p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100/50 dark:border-gray-700/50">
                              <p className="text-[9px] uppercase font-bold text-gray-400 mb-0.5">Préstamos</p>
                              <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                {client.loans.length} <span className="text-[10px] font-medium opacity-60">histórico</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <Link href={`/admin/clients/${client.id}`} className="flex-1">
                              <Button variant="outline" size="sm" className="w-full rounded-xl border-gray-100 dark:border-gray-800 text-xs font-bold h-10 group bg-white dark:bg-gray-900 hover:bg-gray-50">
                                <Eye className="h-3.5 w-3.5 mr-2 text-gray-400 group-hover:text-primary" />
                                Gestionar
                              </Button>
                            </Link>
                            <Link href={`/admin/clients/${client.id}/edit`}>
                              <Button variant="ghost" size="sm" className="rounded-xl h-10 w-10 p-0 text-gray-400 hover:text-primary hover:bg-primary/5">
                                <Edit className="h-4 w-4" />
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Floating Action Button for Mobile */}
      <Link href="/admin/clients/new" className="sm:hidden fixed bottom-20 right-4 z-50">
        <Button className="w-14 h-14 rounded-2xl bg-primary text-white shadow-2xl shadow-primary/40 flex items-center justify-center p-0 active:scale-90 transition-transform">
          <Plus className="h-7 w-7" />
        </Button>
      </Link>
    </div>
  );
}
