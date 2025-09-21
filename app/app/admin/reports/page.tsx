
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ExportReports } from '@/components/export/export-reports';
import { 
  BarChart3, 
  Calendar, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign,
  Users,
  CreditCard,
  Clock,
  RefreshCw,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';

interface DueReport {
  id: string;
  loanNumber: string;
  client: {
    firstName: string;
    lastName: string;
    phone: string;
  };
  dueAmount: number;
  daysOverdue: number;
  lastPaymentDate: string;
  status: string;
}

interface CollectionReport {
  id: string;
  collectorName: string;
  totalCollections: number;
  totalAmount: number;
  loansVisited: number;
  date: string;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });

  // Due Reports State
  const [dueReports, setDueReports] = useState<DueReport[]>([]);
  const [dueStats, setDueStats] = useState({
    totalOverdue: 0,
    totalAmount: 0,
    criticalLoans: 0
  });

  // Collection Reports State
  const [collectionReports, setCollectionReports] = useState<CollectionReport[]>([]);
  const [collectionStats, setCollectionStats] = useState({
    totalCollected: 0,
    activeCollectors: 0,
    totalVisits: 0
  });

  useEffect(() => {
    fetchDueReports();
    fetchCollectionReports();
  }, []);

  const fetchDueReports = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reports/due-loans?dateFrom=${dateRange.from}&dateTo=${dateRange.to}`);
      if (!response.ok) throw new Error('Error al cargar reporte de vencimientos');

      const data = await response.json();
      setDueReports(data.loans || []);
      setDueStats(data.stats || dueStats);
    } catch (error) {
      console.error('Error fetching due reports:', error);
      toast.error('Error al cargar reportes de vencimientos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCollectionReports = async () => {
    try {
      const response = await fetch(`/api/reports/collections?dateFrom=${dateRange.from}&dateTo=${dateRange.to}`);
      if (!response.ok) throw new Error('Error al cargar reporte de cobranza');

      const data = await response.json();
      setCollectionReports(data.collections || []);
      setCollectionStats(data.stats || collectionStats);
    } catch (error) {
      console.error('Error fetching collection reports:', error);
      toast.error('Error al cargar reportes de cobranza');
    }
  };

  const refreshReports = () => {
    fetchDueReports();
    fetchCollectionReports();
    toast.success('Reportes actualizados');
  };

  const getDueBadgeVariant = (daysOverdue: number) => {
    if (daysOverdue <= 0) return 'default';
    if (daysOverdue <= 7) return 'secondary';
    if (daysOverdue <= 30) return 'destructive';
    return 'destructive';
  };

  const getDuePriorityColor = (daysOverdue: number) => {
    if (daysOverdue <= 0) return 'text-green-600';
    if (daysOverdue <= 7) return 'text-yellow-600';
    if (daysOverdue <= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
              Reportes y Análisis
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Vencimientos, cobranza y análisis del portfolio
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={refreshReports}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* Date Range Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Label>Rango de Fechas:</Label>
              <div className="flex items-center gap-2">
                <Input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                />
                <span>hasta</span>
                <Input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                />
                <Button onClick={refreshReports} size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="due-loans" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="due-loans">Vencimientos</TabsTrigger>
          <TabsTrigger value="collections">Cobranza</TabsTrigger>
          <TabsTrigger value="analytics">Análisis</TabsTrigger>
        </TabsList>

        {/* Due Loans Report */}
        <TabsContent value="due-loans">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Préstamos Vencidos</h3>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-600">{dueStats.totalOverdue}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Monto Vencido</h3>
                  <DollarSign className="h-4 w-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-600">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    notation: 'compact'
                  }).format(dueStats.totalAmount)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Préstamos Críticos</h3>
                  <Clock className="h-4 w-4 text-red-500" />
                </div>
                <div className="text-2xl font-bold text-red-600">{dueStats.criticalLoans}</div>
                <p className="text-xs text-muted-foreground">+30 días vencidos</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Préstamos con Vencimientos</CardTitle>
                <CardDescription>
                  Lista detallada de préstamos con pagos vencidos
                </CardDescription>
              </div>
              <ExportReports 
                data={dueReports} 
                filename="reporte-vencimientos"
                reportType="loans"
              />
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
                        <TableHead>Cliente</TableHead>
                        <TableHead>Préstamo</TableHead>
                        <TableHead>Monto Vencido</TableHead>
                        <TableHead>Días Vencidos</TableHead>
                        <TableHead>Último Pago</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Contacto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {dueReports.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center py-8">
                            <div className="flex flex-col items-center gap-2">
                              <Calendar className="h-12 w-12 text-muted-foreground" />
                              <p className="text-muted-foreground">No hay préstamos vencidos</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        dueReports.map((loan) => (
                          <TableRow key={loan.id}>
                            <TableCell className="font-medium">
                              {loan.client.firstName} {loan.client.lastName}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {loan.loanNumber}
                            </TableCell>
                            <TableCell className="font-semibold text-red-600">
                              {new Intl.NumberFormat('es-MX', {
                                style: 'currency',
                                currency: 'MXN'
                              }).format(loan.dueAmount)}
                            </TableCell>
                            <TableCell>
                              <span className={`font-bold ${getDuePriorityColor(loan.daysOverdue)}`}>
                                {loan.daysOverdue > 0 ? `+${loan.daysOverdue}` : loan.daysOverdue} días
                              </span>
                            </TableCell>
                            <TableCell className="text-sm">
                              {loan.lastPaymentDate ? 
                                new Date(loan.lastPaymentDate).toLocaleDateString('es-MX') : 
                                'Sin pagos'
                              }
                            </TableCell>
                            <TableCell>
                              <Badge variant={getDueBadgeVariant(loan.daysOverdue)}>
                                {loan.status}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {loan.client.phone}
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

        {/* Collections Report */}
        <TabsContent value="collections">
          {/* KPIs */}
          <div className="grid gap-4 md:grid-cols-3 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Total Cobrado</h3>
                  <DollarSign className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    notation: 'compact'
                  }).format(collectionStats.totalCollected)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Cobradores Activos</h3>
                  <Users className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">{collectionStats.activeCollectors}</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between space-y-0 pb-2">
                  <h3 className="tracking-tight text-sm font-medium">Visitas Totales</h3>
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                </div>
                <div className="text-2xl font-bold">{collectionStats.totalVisits}</div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Reporte de Cobranza por Cobrador</CardTitle>
                <CardDescription>
                  Rendimiento de cobradores en el período seleccionado
                </CardDescription>
              </div>
              <ExportReports 
                data={collectionReports} 
                filename="reporte-cobranza"
                reportType="payments"
              />
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Cobrador</TableHead>
                      <TableHead>Total Cobros</TableHead>
                      <TableHead>Monto Total</TableHead>
                      <TableHead>Visitas</TableHead>
                      <TableHead>Efectividad</TableHead>
                      <TableHead>Fecha</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {collectionReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center gap-2">
                            <Users className="h-12 w-12 text-muted-foreground" />
                            <p className="text-muted-foreground">No hay reportes de cobranza</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      collectionReports.map((report) => (
                        <TableRow key={report.id}>
                          <TableCell className="font-medium">
                            {report.collectorName}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {report.totalCollections}
                          </TableCell>
                          <TableCell className="font-semibold text-green-600">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN'
                            }).format(report.totalAmount)}
                          </TableCell>
                          <TableCell>
                            {report.loansVisited}
                          </TableCell>
                          <TableCell>
                            <Badge variant={
                              (report.totalCollections / report.loansVisited) > 0.5 
                                ? 'default' 
                                : 'secondary'
                            }>
                              {((report.totalCollections / report.loansVisited) * 100).toFixed(1)}%
                            </Badge>
                          </TableCell>
                          <TableCell className="text-sm">
                            {new Date(report.date).toLocaleDateString('es-MX')}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Análisis del Portfolio
                </CardTitle>
                <CardDescription>
                  Métricas avanzadas y tendencias del negocio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Dashboard de análisis avanzado en desarrollo
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Incluirá gráficos de tendencias, análisis de riesgo y proyecciones
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
