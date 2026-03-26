
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Eye,
  Edit,
  Search,
  Filter,
  CreditCard,
  DollarSign,
  Calendar,
  User,
  ChevronLeft,
  ChevronRight,
  Plus,
  FileText,
  Table,
  Banknote,
  Navigation,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoanStatementModal } from './loan-statement-modal';
import { LoanListSkeleton } from './loan-list-skeleton';
import { NonPaymentModal } from './non-payment-modal';

interface Loan {
  id: string;
  loanNumber: string;
  loanType: string;
  principalAmount: number;
  balanceRemaining: number;
  monthlyPayment: number;
  status: string;
  startDate: string;
  endDate: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  payments: Array<{
    id: string;
    amount: number;
    paymentDate: string;
    status: string;
  }>;
}

interface LoanListProps {
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

export function LoanList({ userRole }: LoanListProps) {
  const { data: session } = useSession();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });
  const [selectedLoanForStatement, setSelectedLoanForStatement] = useState<Loan | null>(null);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [selectedLoanForNonPayment, setSelectedLoanForNonPayment] = useState<Loan | null>(null);
  const [isNonPaymentModalOpen, setIsNonPaymentModalOpen] = useState(false);

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (statusFilter && statusFilter !== 'all') params.append('status', statusFilter);

      const response = await fetch(`/api/loans?${params}`);
      if (!response.ok) throw new Error('Error al cargar préstamos');

      const data = await response.json();
      setLoans(data.loans);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching loans:', error);
      toast.error('Error al cargar los préstamos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [pagination.page, statusFilter]);

  const filteredLoans = loans.filter(loan =>
    loan.loanNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${loan.client.firstName} ${loan.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    loan.client.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
  };

  const handlePageChange = (newPage: number) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  if (loading) {
    return <LoanListSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header y Filtros */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 md:mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-4xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">Gestión de Préstamos</h2>
          <p className="text-sm md:text-base text-muted-foreground hidden md:block">
            {pagination.totalCount} préstamo{pagination.totalCount !== 1 ? 's' : ''} encontrado{pagination.totalCount !== 1 ? 's' : ''}
          </p>
        </div>

        {userRole !== 'CLIENTE' && (
          <Link href="/admin/loans/new" className="w-full md:w-auto">
            <Button 
              size="lg" 
              className="w-full md:w-auto h-14 px-8 rounded-2xl font-black uppercase tracking-widest bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-500/20 active:scale-95 transition-all text-white border-0"
            >
              <Plus className="h-5 w-5 mr-2" />
              Nuevo Préstamo
              <Sparkles className="h-4 w-4 ml-2 text-blue-200" />
            </Button>
          </Link>
        )}
      </div>

      {/* Filtros de búsqueda */}
      <Card>

        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Buscar por número de préstamo, cliente o email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="ACTIVE">Activo</SelectItem>
                <SelectItem value="PAID_OFF">Liquidado</SelectItem>
                <SelectItem value="DEFAULTED">En Mora</SelectItem>
                <SelectItem value="CANCELLED">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      {/* Lista de Préstamos */}
      <div className="space-y-4">
        {filteredLoans.map((loan) => {
          const isActive = loan.status === 'ACTIVE';
          const isPaidOff = loan.status === 'PAID_OFF';
          const isDefaulted = loan.status === 'DEFAULTED';
          
          let borderColor = 'border-l-gray-300';
          if (isActive) borderColor = 'border-l-green-500';
          if (isPaidOff) borderColor = 'border-l-blue-500';
          if (isDefaulted) borderColor = 'border-l-red-500';

          return (
            <Card key={loan.id} className={cn(
              "hover:shadow-lg transition-all active:scale-[0.99] border border-gray-100 dark:border-gray-800 border-l-4 rounded-2xl overflow-hidden shadow-sm",
              borderColor
            )}>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <Link href={`/${userRole?.toLowerCase() || 'admin'}/loans/${loan.id}`}>
                          <h3 className="font-extrabold text-lg md:text-xl text-primary hover:underline leading-none mb-1">
                            {loan.loanNumber}
                          </h3>
                        </Link>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mt-1">
                          {loanTypeConfig[loan.loanType as keyof typeof loanTypeConfig] || loan.loanType}
                        </p>
                      </div>
                      <Badge className={cn(
                        'text-[10px] uppercase font-black px-2 py-0.5 rounded-full border-0', 
                        isActive ? 'bg-green-100 text-green-700' :
                        isPaidOff ? 'bg-blue-100 text-blue-700' :
                        isDefaulted ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-800'
                      )}>
                        {statusConfig[loan.status as keyof typeof statusConfig]?.label || loan.status}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-50/50 dark:bg-gray-900/50 p-3 rounded-2xl border border-gray-100/50 dark:border-gray-800/50">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                          <User className="h-4 w-4 text-primary opacity-80" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase text-gray-400">Cliente</p>
                          <p className="text-xs font-bold text-gray-900 dark:text-gray-100 truncate">
                            {loan.client.firstName} {loan.client.lastName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                          <DollarSign className="h-4 w-4 text-orange-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase text-gray-400">Saldo</p>
                          <p className="text-xs font-extrabold text-orange-600">
                            {formatCurrency(loan.balanceRemaining)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                          <CreditCard className="h-4 w-4 text-blue-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase text-gray-400">Cuota</p>
                          <p className="text-xs font-extrabold text-blue-600">
                            {formatCurrency(loan.monthlyPayment)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-white dark:bg-gray-800 flex items-center justify-center shadow-sm">
                          <Calendar className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[9px] font-bold uppercase text-gray-400">Vence</p>
                          <p className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            {formatDate(loan.endDate)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {loan.payments.length > 0 && (
                      <div className="flex items-center gap-2 px-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <p className="text-[10px] font-bold text-gray-500">
                          Último pago: <span className="text-gray-900 dark:text-gray-100">{formatDate(loan.payments[0].paymentDate)}</span> · <span className="text-green-600 font-black">{formatCurrency(loan.payments[0].amount)}</span>
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                    {/* Botón Ver */}
                    <Link href={`/${userRole?.toLowerCase() || 'admin'}/loans/${loan.id}`} className="flex-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="group w-full h-11 px-4 rounded-xl font-bold bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-all shadow-sm"
                      >
                        <Eye className="h-4 w-4 mr-2 text-gray-500 group-hover:text-inherit" />
                        Ver
                      </Button>
                    </Link>

                    {/* Botón Tabla Amortización */}
                    <Link href={`/${userRole?.toLowerCase() || 'admin'}/loans/${loan.id}?tab=schedule`} className="flex-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="group w-full h-11 px-4 rounded-xl font-bold bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                      >
                        <Table className="h-4 w-4 mr-2 text-blue-500 group-hover:text-inherit" />
                        Tabla
                      </Button>
                    </Link>

                    {/* Botón Cobrar */}
                    {userRole !== 'CLIENTE' && (
                      <Link href={`/${userRole?.toLowerCase() || 'admin'}/payments/new?loanId=${loan.id}`} className="flex-1">
                        <Button 
                          variant="default" 
                          size="sm" 
                          className="w-full h-11 px-5 rounded-xl font-bold bg-green-600 hover:bg-green-700 text-white transition-all shadow-lg hover:shadow-green-500/20"
                        >
                          <Banknote className="h-4 w-4 mr-2" />
                          Cobrar
                        </Button>
                      </Link>
                    )}
                    
                    {/* Botón Edo Cta Modal */}
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 h-11 rounded-xl border-blue-200 text-blue-600 font-bold hover:bg-blue-100 transition-all shadow-sm"
                      onClick={() => {
                        setSelectedLoanForStatement(loan);
                        setIsStatementModalOpen(true);
                      }}
                    >
                      <FileText className="h-4 w-4 mr-1.5" />
                      Saldos
                    </Button>

                    {/* Botón NO PAGO */}
                    {userRole !== 'CLIENTE' && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-11 rounded-xl border-red-200 text-red-600 font-bold hover:bg-red-50 transition-all shadow-sm"
                        onClick={() => {
                          setSelectedLoanForNonPayment(loan);
                          setIsNonPaymentModalOpen(true);
                        }}
                      >
                        <Navigation className="h-4 w-4 mr-1.5" />
                        No Pago
                      </Button>
                    )}

                    {userRole !== 'CLIENTE' && (
                      <Link href={`/${userRole?.toLowerCase() || 'admin'}/loans/${loan.id}/edit`} className="flex-1">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          className="w-full h-11 rounded-xl font-bold bg-amber-100 text-amber-700 hover:bg-amber-600 hover:text-white dark:bg-amber-900/40 dark:text-amber-400 dark:hover:bg-amber-700 transition-all shadow-sm"
                        >
                          <Edit className="h-4 w-4 mr-1.5" />
                          Editar
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {filteredLoans.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <CreditCard className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No se encontraron préstamos
              </h3>
              <p className="text-muted-foreground">
                {searchTerm || statusFilter
                  ? 'Intenta ajustar tus filtros de búsqueda'
                  : 'Aún no hay préstamos registrados'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Paginación */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <p className="text-sm text-muted-foreground">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.totalCount)} de{' '}
            {pagination.totalCount} resultados
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page - 1)}
              disabled={pagination.page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-sm">
              Página {pagination.page} de {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <LoanStatementModal
        isOpen={isStatementModalOpen}
        onOpenChange={setIsStatementModalOpen}
        loan={selectedLoanForStatement}
      />

      <NonPaymentModal
        isOpen={isNonPaymentModalOpen}
        onOpenChange={setIsNonPaymentModalOpen}
        loan={selectedLoanForNonPayment}
        onSuccess={fetchLoans}
      />
    </div>
  );
}
