'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
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
  RotateCw,
  X,
  Phone,
  Mail,
  MessageCircle,
  ShieldCheck,
  CreditCard,
  User as UserIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

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
    id?: string;
    firstName: string;
    lastName: string;
    email?: string;
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
  const { data: session } = useSession() || {};
  const [clients, setClients] = useState<Client[]>([]);
  const [stats, setStats] = useState<ClientsStats>({
    totalClients: 0,
    activeClients: 0,
    totalLoans: 0,
    totalPortfolio: 0,
    avgCreditScore: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchClients();
    }, 400);
    return () => clearTimeout(timer);
  }, [currentPage, statusFilter, searchTerm]);

  const fetchClients = async (refresh = false) => {
    if (refresh) setIsRefreshing(true);
    else setLoading(true);

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
      const rawClients = data.clients || [];
      const uppercaseClients = rawClients.map((c: Client) => ({
        ...c,
        firstName: (c.firstName || '').toUpperCase(),
        lastName: (c.lastName || '').toUpperCase(),
        asesor: c.asesor ? {
          ...c.asesor,
          firstName: (c.asesor.firstName || '').toUpperCase(),
          lastName: (c.asesor.lastName || '').toUpperCase(),
        } : c.asesor
      }));

      setClients(uppercaseClients);
      setTotalPages(data.pagination?.totalPages || 1);

      // Métricas de cartera
      const totalClients = data.pagination?.totalCount || 0;
      const activeClients = data.stats?.activeClients ?? uppercaseClients.filter((c: Client) => c.status === 'ACTIVE').length;
      const totalLoans = uppercaseClients.reduce((acc: number, c: Client) => acc + (c.loans?.length || 0), 0);
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
      setIsRefreshing(false);
    }
  };

  const filteredClients = clients;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            ACTIVO
          </span>
        );
      case 'INACTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            INACTIVO
          </span>
        );
      case 'SUSPENDED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            SUSPENDIDO
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            {status || 'DESCONOCIDO'}
          </span>
        );
    }
  };

  const getScoreBadge = (score: number) => {
    if (!score) return <span className="text-xs font-semibold text-gray-400">N/A</span>;
    if (score >= 680) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200/60">
          <ShieldCheck className="w-3 h-3 text-emerald-600" />
          {score}
        </span>
      );
    }
    if (score >= 550) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300 border border-amber-200/60">
          <ShieldCheck className="w-3 h-3 text-amber-600" />
          {score}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200/60">
        <ShieldCheck className="w-3 h-3 text-rose-600" />
        {score}
      </span>
    );
  };

  const formatCleanPhone = (phone: string) => {
    if (!phone) return '';
    const digits = phone.replace(/\D/g, '');
    if (digits.length === 10) return `52${digits}`;
    return digits;
  };

  return (
    <TooltipProvider>
      <div className="space-y-4 pb-20 md:pb-6">
        
        {/* Top Actions & Quick Segment Bar (Sin título redundante) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-gray-900 p-2.5 sm:p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          
          {/* Quick Status Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            {[
              { id: 'all', label: 'Todos', count: stats.totalClients },
              { id: 'ACTIVE', label: 'Activos', count: stats.activeClients, dot: 'bg-emerald-500' },
              { id: 'INACTIVE', label: 'Inactivos', dot: 'bg-amber-500' },
              { id: 'SUSPENDED', label: 'Suspendidos', dot: 'bg-rose-500' },
            ].map((tab) => {
              const active = statusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setStatusFilter(tab.id);
                    setCurrentPage(1);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer",
                    active
                      ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  {tab.dot && (
                    <span className={cn("w-1.5 h-1.5 rounded-full", tab.dot, active && "bg-white")} />
                  )}
                  <span>{tab.label}</span>
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.2 rounded-full font-black ml-0.5",
                      active ? "bg-white/20 text-white" : "bg-gray-200/70 dark:bg-gray-800 text-gray-600 dark:text-gray-300"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fetchClients(true)}
                  disabled={loading || isRefreshing}
                  className="h-9 w-9 p-0 rounded-xl border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                  aria-label="Actualizar lista de clientes"
                >
                  <RotateCw className={cn("h-4 w-4", isRefreshing && "animate-spin text-primary")} />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">Actualizar datos</TooltipContent>
            </Tooltip>

            {(session?.user?.role === 'ADMIN' || session?.user?.role === 'SUPER_ADMIN') && (
              <Link href="/admin/clients/migrate">
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="h-9 rounded-xl border-blue-200 dark:border-blue-900/60 text-blue-700 dark:text-blue-300 bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-100 font-semibold text-xs px-3"
                >
                  <Database className="h-3.5 w-3.5 mr-1.5 text-blue-600 dark:text-blue-400" />
                  Migrar
                </Button>
              </Link>
            )}

            <Link href="/admin/clients/new">
              <Button 
                size="sm" 
                className="h-9 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs px-3.5 shadow-sm shadow-primary/20 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Nuevo Cliente
              </Button>
            </Link>
          </div>
        </div>

        {/* Barra de Filtro y Búsqueda */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
            <Input
              placeholder="BUSCAR POR NOMBRE, TELÉFONO O CORREO..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value.toUpperCase());
                setCurrentPage(1);
              }}
              className="pl-10 pr-9 h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-xl uppercase text-xs font-semibold focus-visible:ring-primary shadow-2xs"
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 cursor-pointer"
                aria-label="Limpiar búsqueda"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Select value={statusFilter} onValueChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}>
              <SelectTrigger className="w-full sm:w-44 h-11 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 rounded-xl text-xs font-semibold">
                <Filter className="h-3.5 w-3.5 mr-2 text-gray-500" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="INACTIVE">Inactivo</SelectItem>
                <SelectItem value="SUSPENDED">Suspendido</SelectItem>
              </SelectContent>
            </Select>

            {(searchTerm || statusFilter !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="h-11 px-3 rounded-xl text-xs text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 font-semibold"
              >
                Limpiar
              </Button>
            )}
          </div>
        </div>

        {/* Tabla Principal & Vista Mobile */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200/80 dark:border-gray-800 shadow-sm overflow-hidden">
          
          {/* Sub-toolbar de conteo */}
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 font-medium">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900 dark:text-white">
                {filteredClients.length}
              </span>
              <span>
                {filteredClients.length === 1 ? 'cliente encontrado' : 'clientes encontrados'}
              </span>
              {searchTerm && (
                <span className="text-primary font-medium">
                  para "{searchTerm}"
                </span>
              )}
            </div>
            <span className="hidden sm:inline-block text-[11px] text-gray-400">
              Página {currentPage} de {totalPages}
            </span>
          </div>

          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div 
                  key={i} 
                  className="flex items-center justify-between p-4 border border-gray-100 dark:border-gray-800/80 rounded-xl gap-4 bg-gray-50/40 dark:bg-gray-800/20 animate-pulse"
                >
                  <div className="flex items-center gap-3.5 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 shrink-0" />
                    <div className="space-y-2 flex-1">
                      <div className="h-4 w-44 bg-gray-200 dark:bg-gray-700 rounded" />
                      <div className="h-3 w-28 bg-gray-100 dark:bg-gray-800 rounded" />
                    </div>
                  </div>
                  <div className="h-8 w-24 bg-gray-200 dark:bg-gray-700 rounded-lg hidden sm:block" />
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Vista Desktop: Tabla de Alta Fidelidad */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/75 dark:bg-gray-800/40 hover:bg-gray-50/75 border-b border-gray-100 dark:border-gray-800">
                      <TableHead className="w-[30%] text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Cliente</TableHead>
                      <TableHead className="w-[20%] text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Contacto</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Estado</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Asesor</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Préstamos</TableHead>
                      <TableHead className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Score</TableHead>
                      <TableHead className="text-right text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredClients.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-16">
                          <div className="flex flex-col items-center justify-center max-w-sm mx-auto">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mb-3">
                              <Users className="h-7 w-7" />
                            </div>
                            <h4 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                              {searchTerm ? 'Sin coincidencias' : 'No hay clientes registrados'}
                            </h4>
                            <p className="text-xs text-gray-500 text-center mb-4">
                              {searchTerm 
                                ? `No encontramos ningún cliente que coincida con "${searchTerm}".`
                                : 'Comienza registrando a tu primer cliente para crear solicitudes y préstamos.'}
                            </p>
                            {searchTerm ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setSearchTerm('')}
                                className="rounded-xl text-xs font-semibold"
                              >
                                Limpiar búsqueda
                              </Button>
                            ) : (
                              <Link href="/admin/clients/new">
                                <Button size="sm" className="rounded-xl font-bold text-xs">
                                  <Plus className="h-4 w-4 mr-1" />
                                  Registrar Cliente
                                </Button>
                              </Link>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredClients.map((client) => {
                        const initials = `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`;
                        const cleanPhone = formatCleanPhone(client.phone);
                        const hasActiveLoan = client.loans?.some(l => l.status === 'ACTIVE');

                        return (
                          <TableRow 
                            key={client.id}
                            className="hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-colors border-b border-gray-100/80 dark:border-gray-800/80 group"
                          >
                            {/* Cliente Avatar + Nombre */}
                            <TableCell className="py-3">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/10 to-primary/20 text-primary flex items-center justify-center font-black text-xs shrink-0 border border-primary/20">
                                  {initials || 'CL'}
                                </div>
                                <div className="min-w-0">
                                  <Link 
                                    href={`/admin/clients/${client.id}`}
                                    className="font-bold text-sm text-gray-900 dark:text-gray-100 hover:text-primary transition-colors block truncate uppercase tracking-tight"
                                  >
                                    {client.firstName} {client.lastName}
                                  </Link>
                                  <span className="text-[11px] text-gray-400 font-mono">
                                    ID: {client.id.slice(-6)}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            {/* Contacto */}
                            <TableCell className="py-3">
                              <div className="space-y-0.5">
                                {client.phone ? (
                                  <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 font-medium">
                                    <Phone className="w-3 h-3 text-gray-400" />
                                    <span>{client.phone}</span>
                                    {cleanPhone && (
                                      <a
                                        href={`https://wa.me/52${cleanPhone}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 p-0.5"
                                        title="Enviar WhatsApp"
                                      >
                                        <MessageCircle className="w-3.5 h-3.5" />
                                      </a>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-xs text-gray-400">Sin teléfono</span>
                                )}
                                {client.email && (
                                  <div className="flex items-center gap-1.5 text-[11px] text-gray-400 truncate max-w-[180px]">
                                    <Mail className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{client.email}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>

                            {/* Estado */}
                            <TableCell className="py-3">
                              {getStatusBadge(client.status)}
                            </TableCell>

                            {/* Asesor */}
                            <TableCell className="py-3">
                              {client.asesor ? (
                                <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-gray-100/80 dark:bg-gray-800 text-[11px] font-bold text-gray-700 dark:text-gray-300 uppercase">
                                  <UserIcon className="w-3 h-3 text-gray-400" />
                                  <span className="truncate max-w-[120px]">
                                    {client.asesor.firstName} {client.asesor.lastName}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-xs text-gray-400 font-medium">
                                  Sin Asesor
                                </span>
                              )}
                            </TableCell>

                            {/* Préstamos */}
                            <TableCell className="py-3">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "font-bold text-xs rounded-lg px-2 py-0.5",
                                  hasActiveLoan 
                                    ? "border-primary/30 text-primary bg-primary/5" 
                                    : "border-gray-200 text-gray-500"
                                )}
                              >
                                {client.loans?.length || 0} {client.loans?.length === 1 ? 'préstamo' : 'préstamos'}
                              </Badge>
                            </TableCell>

                            {/* Score */}
                            <TableCell className="py-3">
                              {getScoreBadge(client.creditScore)}
                            </TableCell>

                            {/* Acciones */}
                            <TableCell className="py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Link href={`/admin/clients/${client.id}`}>
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        className="h-8 px-2.5 rounded-lg border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-primary hover:border-primary/40 hover:bg-primary/5"
                                      >
                                        <Eye className="h-3.5 w-3.5 mr-1 text-gray-400 group-hover:text-primary" />
                                        Expediente
                                      </Button>
                                    </Link>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Ver perfil y créditos</TooltipContent>
                                </Tooltip>

                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Link href={`/admin/clients/${client.id}/edit`}>
                                      <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        className="h-8 w-8 p-0 rounded-lg text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                                      >
                                        <Edit className="h-3.5 w-3.5" />
                                      </Button>
                                    </Link>
                                  </TooltipTrigger>
                                  <TooltipContent side="top">Editar cliente</TooltipContent>
                                </Tooltip>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Vista Mobile: Tarjetas Premium Táctiles (>= 44px) */}
              <div className="md:hidden divide-y divide-gray-100 dark:divide-gray-800">
                {filteredClients.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 mx-auto mb-3">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-1">
                      {searchTerm ? 'Sin coincidencias' : 'No hay clientes registrados'}
                    </p>
                    <p className="text-xs text-gray-500 mb-4">
                      {searchTerm ? 'Intenta con otro término de búsqueda' : 'Registra clientes para comenzar'}
                    </p>
                    {searchTerm && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSearchTerm('')}
                        className="rounded-xl text-xs font-semibold"
                      >
                        Limpiar búsqueda
                      </Button>
                    )}
                  </div>
                ) : (
                  filteredClients.map((client) => {
                    const initials = `${client.firstName?.[0] || ''}${client.lastName?.[0] || ''}`;
                    const cleanPhone = formatCleanPhone(client.phone);

                    return (
                      <div key={client.id} className="p-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-primary/10 to-primary/25 text-primary flex items-center justify-center font-black text-sm shrink-0 border border-primary/20">
                              {initials || 'CL'}
                            </div>
                            <div className="min-w-0">
                              <Link 
                                href={`/admin/clients/${client.id}`}
                                className="font-bold text-sm text-gray-900 dark:text-white uppercase tracking-tight block truncate"
                              >
                                {client.firstName} {client.lastName}
                              </Link>
                              <div className="flex items-center gap-2 mt-0.5">
                                {getStatusBadge(client.status)}
                                <span className="text-[11px] text-gray-400 font-mono">#{client.phone || client.id.slice(-4)}</span>
                              </div>
                            </div>
                          </div>
                          {getScoreBadge(client.creditScore)}
                        </div>

                        {/* Metadatos en Grid */}
                        <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                          <div className="bg-gray-50 dark:bg-gray-800/60 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span className="text-[9px] font-black uppercase text-gray-400 block mb-0.5">Asesor</span>
                            <span className="font-bold text-gray-700 dark:text-gray-300 truncate block uppercase text-[11px]">
                              {client.asesor ? `${client.asesor.firstName} ${client.asesor.lastName || ''}` : 'Sin Asesor'}
                            </span>
                          </div>
                          <div className="bg-gray-50 dark:bg-gray-800/60 p-2 rounded-xl border border-gray-100 dark:border-gray-800">
                            <span className="text-[9px] font-black uppercase text-gray-400 block mb-0.5">Préstamos</span>
                            <span className="font-bold text-gray-700 dark:text-gray-300 block text-[11px]">
                              {client.loans?.length || 0} contratos
                            </span>
                          </div>
                        </div>

                        {/* Botonera de Acción Táctil (>= 44px de altura) */}
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/clients/${client.id}`} className="flex-1">
                            <Button 
                              variant="outline" 
                              className="w-full h-11 rounded-xl font-bold text-xs border-gray-200 dark:border-gray-800 hover:border-primary/40 text-gray-700 dark:text-gray-200"
                            >
                              <Eye className="h-4 w-4 mr-1.5 text-primary" />
                              Expediente
                            </Button>
                          </Link>

                          {cleanPhone && (
                            <a 
                              href={`https://wa.me/52${cleanPhone}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="h-11 w-11 rounded-xl flex items-center justify-center bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 shrink-0"
                              aria-label="Abrir WhatsApp"
                            >
                              <MessageCircle className="h-5 w-5" />
                            </a>
                          )}

                          <Link href={`/admin/clients/${client.id}/edit`}>
                            <Button 
                              variant="ghost" 
                              className="h-11 w-11 p-0 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0"
                              aria-label="Editar cliente"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Paginación Refinada */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                    Mostrando página <span className="font-bold text-gray-900 dark:text-white">{currentPage}</span> de <span className="font-bold text-gray-900 dark:text-white">{totalPages}</span>
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1 || loading}
                      className="h-8 px-3 rounded-lg text-xs font-semibold"
                    >
                      <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages || loading}
                      className="h-8 px-3 rounded-lg text-xs font-semibold"
                    >
                      Siguiente
                      <ChevronRight className="h-3.5 w-3.5 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Action Button for Mobile */}
        <Link href="/admin/clients/new" className="sm:hidden fixed bottom-20 right-4 z-50">
          <Button 
            className="w-14 h-14 rounded-2xl bg-primary text-primary-foreground shadow-2xl shadow-primary/40 flex items-center justify-center p-0 active:scale-90 transition-transform"
            aria-label="Crear nuevo cliente"
          >
            <Plus className="h-7 w-7" />
          </Button>
        </Link>
      </div>
    </TooltipProvider>
  );
}
