
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
  FileText
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { LoanStatementModal } from './loan-statement-modal';
import { LoanListSkeleton } from './loan-list-skeleton';

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
            <Button size="lg" className="w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Préstamo
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
        {filteredLoans.map((loan) => (
          <Card key={loan.id} className="hover:shadow-md transition-all active:scale-[0.99] border-border">
            <CardContent className="p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-base md:text-lg text-gray-900 dark:text-white">
                        {loan.loanNumber}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {loanTypeConfig[loan.loanType as keyof typeof loanTypeConfig] || loan.loanType}
                      </p>
                    </div>
                    <Badge className={cn('text-[10px] px-1.5 h-4', statusConfig[loan.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800')}>
                      {statusConfig[loan.status as keyof typeof statusConfig]?.label || loan.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs md:text-sm text-muted-foreground bg-muted/30 p-2 md:p-0 md:bg-transparent rounded-lg">
                    <div className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 opacity-70" />
                      <span className="truncate">
                        {loan.client.firstName} {loan.client.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <DollarSign className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 opacity-70" />
                      <span className="truncate">Saldo: {formatCurrency(loan.balanceRemaining)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <CreditCard className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 opacity-70" />
                      <span className="truncate">Pago: {formatCurrency(loan.monthlyPayment)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 flex-shrink-0 opacity-70" />
                      <span className="truncate">Vence: {formatDate(loan.endDate)}</span>
                    </div>
                  </div>

                  {loan.payments.length > 0 && (
                    <div className="text-xs text-muted-foreground hidden md:block mt-2">
                      Último pago: {formatDate(loan.payments[0].paymentDate)} - {formatCurrency(loan.payments[0].amount)}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:flex md:items-center gap-2 mt-2 md:mt-0">
                  <Link href={`/${userRole?.toLowerCase() || 'admin'}/loans/${loan.id}`}>
                    <Button variant="outline" size="sm" className="w-full h-9">
                      <Eye className="h-4 w-4 md:mr-1" />
                      <span className="hidden md:inline">Ver</span>
                    </Button>
                  </Link>

                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full h-9"
                    onClick={() => {
                      setSelectedLoanForStatement(loan);
                      setIsStatementModalOpen(true);
                    }}
                  >
                    <FileText className="h-4 w-4 mr-1" />
                    <span className="truncate text-xs md:text-sm">Edo Cta</span>
                  </Button>

                  {userRole !== 'CLIENTE' && (
                    <Link href={`/${userRole?.toLowerCase() || 'admin'}/loans/${loan.id}/edit`} className="col-span-2 md:col-span-1">
                      <Button variant="outline" size="sm" className="w-full h-9">
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                    </Link>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

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
        <div className="flex items-center justify-between">
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
    </div>
  );
}
