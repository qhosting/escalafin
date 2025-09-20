
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import OpenpayIntegration from '@/components/payments/openpay-integration';
import { 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentTransaction {
  id: string;
  amount: number;
  status: string;
  provider: string;
  createdAt: string;
  payment?: {
    loan?: {
      loanNumber: string;
      client?: {
        firstName: string;
        lastName: string;
      };
    };
  };
}

export default function PaymentsPage() {
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTransactions: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
    failedTransactions: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments/transactions');
      if (!response.ok) throw new Error('Error al cargar transacciones');

      const data = await response.json();
      setTransactions(data.transactions || []);
      setStats(data.stats || stats);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast.error('Error al cargar las transacciones');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAILED':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'PENDING':
      case 'PROCESSING':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <Clock className="h-4 w-4 text-blue-500" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default' as const;
      case 'FAILED':
        return 'destructive' as const;
      case 'PENDING':
      case 'PROCESSING':
        return 'secondary' as const;
      default:
        return 'outline' as const;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
          Gestión de Pagos
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Procesamiento de pagos con Openpay y gestión de transacciones
        </p>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Total Transacciones</h3>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">{stats.totalTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Monto Total</h3>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: 'MXN',
                notation: 'compact'
              }).format(stats.totalAmount)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Completadas</h3>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.completedTransactions}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Fallidas</h3>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </div>
            <div className="text-2xl font-bold text-red-600">{stats.failedTransactions}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="transactions" className="space-y-6">
        <TabsList>
          <TabsTrigger value="transactions">Transacciones</TabsTrigger>
          <TabsTrigger value="new-payment">Nuevo Pago</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Historial de Transacciones</CardTitle>
                <CardDescription>
                  Lista completa de todas las transacciones de pago procesadas
                </CardDescription>
              </div>
              <Button variant="outline" onClick={fetchTransactions}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualizar
              </Button>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID Transacción</TableHead>
                        <TableHead>Cliente</TableHead>
                        <TableHead>Préstamo</TableHead>
                        <TableHead>Monto</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Proveedor</TableHead>
                        <TableHead>Fecha</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <CreditCard className="h-12 w-12 text-muted-foreground" />
                              <p className="text-muted-foreground">No hay transacciones registradas</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        transactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="font-mono text-sm">
                              {transaction.id.substring(0, 8)}...
                            </TableCell>
                            <TableCell>
                              {transaction.payment?.loan?.client 
                                ? `${transaction.payment.loan.client.firstName} ${transaction.payment.loan.client.lastName}`
                                : 'N/A'}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {transaction.payment?.loan?.loanNumber || 'N/A'}
                            </TableCell>
                            <TableCell className="font-semibold">
                              {new Intl.NumberFormat('es-MX', {
                                style: 'currency',
                                currency: 'MXN'
                              }).format(transaction.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getStatusIcon(transaction.status)}
                                <Badge variant={getStatusVariant(transaction.status)}>
                                  {transaction.status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{transaction.provider}</Badge>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {new Date(transaction.createdAt).toLocaleDateString('es-MX')}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="new-payment">
          <OpenpayIntegration 
            onSuccess={(result) => {
              toast.success('Pago procesado exitosamente');
              fetchTransactions();
            }}
            onError={(error) => {
              toast.error(`Error en el pago: ${error}`);
            }}
          />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configuración de Pagos</CardTitle>
              <CardDescription>
                Configuración de proveedores de pago y parámetros del sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  La configuración avanzada de pagos se implementará próximamente
                </p>
                <Button variant="outline">
                  Configurar proveedores de pago
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
