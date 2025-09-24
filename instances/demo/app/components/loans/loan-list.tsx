
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
  Plus
} from 'lucide-react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalCount: 0,
    totalPages: 0
  });

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString()
      });

      if (statusFilter) params.append('status', statusFilter);

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
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header y Filtros */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Gestión de Préstamos</h2>
          <p className="text-muted-foreground">
            {pagination.totalCount} préstamo{pagination.totalCount !== 1 ? 's' : ''} encontrado{pagination.totalCount !== 1 ? 's' : ''}
          </p>
        </div>

        {userRole !== 'CLIENTE' && (
          <Link href="/admin/loans/new">
            <Button className="w-full lg:w-auto">
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
                <SelectItem value="">Todos los estados</SelectItem>
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
          <Card key={loan.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-semibold text-lg text-foreground">
                        {loan.loanNumber}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {loanTypeConfig[loan.loanType as keyof typeof loanTypeConfig] || loan.loanType}
                      </p>
                    </div>
                    <Badge className={statusConfig[loan.status as keyof typeof statusConfig]?.color || 'bg-gray-100 text-gray-800'}>
                      {statusConfig[loan.status as keyof typeof statusConfig]?.label || loan.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">
                        {loan.client.firstName} {loan.client.lastName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">Saldo: {formatCurrency(loan.balanceRemaining)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">Pago: {formatCurrency(loan.monthlyPayment)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-foreground">Vence: {formatDate(loan.endDate)}</span>
                    </div>
                  </div>

                  {loan.payments.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Último pago: {formatDate(loan.payments[0].paymentDate)} - {formatCurrency(loan.payments[0].amount)}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Link href={`/${userRole?.toLowerCase() || 'admin'}/loans/${loan.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="h-4 w-4 mr-1" />
                      Ver
                    </Button>
                  </Link>
                  {userRole !== 'CLIENTE' && (
                    <Link href={`/${userRole?.toLowerCase() || 'admin'}/loans/${loan.id}/edit`}>
                      <Button variant="outline" size="sm">
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
    </div>
  );
}
