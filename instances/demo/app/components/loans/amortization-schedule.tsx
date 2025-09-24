
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  DollarSign, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  Download
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

interface AmortizationItem {
  id: string;
  paymentNumber: number;
  paymentDate: string;
  principalPayment: number;
  interestPayment: number;
  totalPayment: number;
  remainingBalance: number;
  isPaid: boolean;
  payment?: {
    id: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    status: string;
    reference?: string;
  };
}

interface AmortizationSummary {
  totalPayments: number;
  paidPayments: number;
  pendingPayments: number;
  totalPrincipal: number;
  totalInterest: number;
  paidAmount: number;
  pendingAmount: number;
}

interface AmortizationScheduleProps {
  loanId: string;
}

export function AmortizationSchedule({ loanId }: AmortizationScheduleProps) {
  const [schedule, setSchedule] = useState<AmortizationItem[]>([]);
  const [summary, setSummary] = useState<AmortizationSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/loans/${loanId}/amortization`);
      if (!response.ok) throw new Error('Error al cargar la tabla de amortización');

      const data = await response.json();
      setSchedule(data.amortizationSchedule);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching amortization schedule:', error);
      toast.error('Error al cargar la tabla de amortización');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
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

  const exportToPDF = async () => {
    try {
      const response = await fetch(`/api/loans/${loanId}/amortization/export`, {
        method: 'GET',
      });
      
      if (!response.ok) throw new Error('Error al generar el PDF');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `tabla_amortizacion_${loanId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast.success('Tabla de amortización descargada exitosamente');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Error al descargar la tabla de amortización');
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-32 bg-gray-200 animate-pulse rounded-lg" />
        <div className="h-64 bg-gray-200 animate-pulse rounded-lg" />
      </div>
    );
  }

  if (!summary || schedule.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay tabla de amortización disponible
          </h3>
          <p className="text-gray-500">
            La tabla de amortización se genera automáticamente al crear el préstamo.
          </p>
        </CardContent>
      </Card>
    );
  }

  const progressPercentage = Math.round((summary.paidPayments / summary.totalPayments) * 100);

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pagos Totales</p>
                <p className="text-lg font-semibold">{summary.totalPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pagos Realizados</p>
                <p className="text-lg font-semibold">{summary.paidPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pagos Pendientes</p>
                <p className="text-lg font-semibold">{summary.pendingPayments}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Progreso</p>
                <p className="text-lg font-semibold">{progressPercentage}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progreso Visual */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Progreso del Préstamo</h3>
              <span className="text-sm text-gray-600">
                {summary.paidPayments} de {summary.totalPayments} pagos
              </span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Monto Pagado</p>
                <p className="font-medium text-green-600">{formatCurrency(summary.paidAmount)}</p>
              </div>
              <div>
                <p className="text-gray-600">Monto Pendiente</p>
                <p className="font-medium text-orange-600">{formatCurrency(summary.pendingAmount)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Amortización */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Tabla de Amortización</CardTitle>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Descargar PDF
          </Button>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Capital</TableHead>
                  <TableHead>Interés</TableHead>
                  <TableHead>Pago Total</TableHead>
                  <TableHead>Saldo</TableHead>
                  <TableHead>Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {schedule.map((item) => (
                  <TableRow key={item.id} className={item.isPaid ? 'bg-green-50' : ''}>
                    <TableCell className="font-medium">
                      {item.paymentNumber}
                    </TableCell>
                    <TableCell>
                      {formatDate(item.paymentDate)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(item.principalPayment)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(item.interestPayment)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.totalPayment)}
                    </TableCell>
                    <TableCell>
                      {formatCurrency(item.remainingBalance)}
                    </TableCell>
                    <TableCell>
                      {item.isPaid ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Pagado
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">
                          <Clock className="h-3 w-3 mr-1" />
                          Pendiente
                        </Badge>
                      )}
                      {item.payment && (
                        <div className="text-xs text-gray-500 mt-1">
                          {formatDate(item.payment.paymentDate)}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Resumen de Totales */}
          <div className="mt-6 pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="text-center">
                <p className="text-gray-600">Total Capital</p>
                <p className="font-medium text-lg">{formatCurrency(summary.totalPrincipal)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Total Intereses</p>
                <p className="font-medium text-lg">{formatCurrency(summary.totalInterest)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Total a Pagar</p>
                <p className="font-medium text-lg">{formatCurrency(summary.totalPrincipal + summary.totalInterest)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
