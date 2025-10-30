
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  DollarSign, 
  AlertTriangle,
  TrendingUp,
  Calendar,
  Users,
  Download,
  Filter,
  Clock
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface CollectionRecord {
  id: string;
  clientName: string;
  loanId: string;
  amountDue: number;
  daysOverdue: number;
  lastPaymentDate: Date | null;
  nextPaymentDate: Date;
  phoneNumber: string;
  status: 'CURRENT' | 'WARNING' | 'OVERDUE' | 'CRITICAL';
  asesorName: string;
}

export default function CollectionsReportPage() {
  const [records, setRecords] = useState<CollectionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    fetchCollectionRecords();
  }, []);

  const fetchCollectionRecords = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // const response = await fetch('/api/reports/collections');
      // const data = await response.json();
      
      // Mock data
      const mockRecords: CollectionRecord[] = [
        {
          id: '1',
          clientName: 'Juan Pérez',
          loanId: 'ESF-2024-001',
          amountDue: 9025,
          daysOverdue: 0,
          lastPaymentDate: new Date('2024-09-01'),
          nextPaymentDate: new Date('2024-10-01'),
          phoneNumber: '+52 555 123 4567',
          status: 'CURRENT',
          asesorName: 'María García'
        },
        {
          id: '2',
          clientName: 'Ana Martínez',
          loanId: 'ESF-2024-002',
          amountDue: 12500,
          daysOverdue: 3,
          lastPaymentDate: new Date('2024-08-28'),
          nextPaymentDate: new Date('2024-09-28'),
          phoneNumber: '+52 555 234 5678',
          status: 'WARNING',
          asesorName: 'Carlos López'
        },
        {
          id: '3',
          clientName: 'Roberto Sánchez',
          loanId: 'ESF-2024-003',
          amountDue: 8000,
          daysOverdue: 15,
          lastPaymentDate: new Date('2024-08-15'),
          nextPaymentDate: new Date('2024-09-15'),
          phoneNumber: '+52 555 345 6789',
          status: 'OVERDUE',
          asesorName: 'María García'
        },
        {
          id: '4',
          clientName: 'Patricia Hernández',
          loanId: 'ESF-2024-004',
          amountDue: 15000,
          daysOverdue: 30,
          lastPaymentDate: new Date('2024-08-01'),
          nextPaymentDate: new Date('2024-09-01'),
          phoneNumber: '+52 555 456 7890',
          status: 'CRITICAL',
          asesorName: 'Carlos López'
        }
      ];
      
      setRecords(mockRecords);
    } catch (error) {
      console.error('Error fetching collection records:', error);
      toast.error('Error al cargar el reporte de cobranza');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CURRENT':
        return <Badge className="bg-green-100 text-green-800">Al Corriente</Badge>;
      case 'WARNING':
        return <Badge className="bg-yellow-100 text-yellow-800">Advertencia</Badge>;
      case 'OVERDUE':
        return <Badge className="bg-orange-100 text-orange-800">Vencido</Badge>;
      case 'CRITICAL':
        return <Badge className="bg-red-100 text-red-800">Crítico</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getPriorityColor = (status: string) => {
    switch (status) {
      case 'CURRENT':
        return 'border-l-4 border-l-green-500';
      case 'WARNING':
        return 'border-l-4 border-l-yellow-500';
      case 'OVERDUE':
        return 'border-l-4 border-l-orange-500';
      case 'CRITICAL':
        return 'border-l-4 border-l-red-500';
      default:
        return '';
    }
  };

  const filteredRecords = records.filter(record => {
    if (filterStatus === 'all') return true;
    return record.status === filterStatus;
  });

  // Stats calculations
  const totalDue = filteredRecords.reduce((sum, r) => sum + r.amountDue, 0);
  const overdueCount = records.filter(r => r.status === 'OVERDUE' || r.status === 'CRITICAL').length;
  const criticalCount = records.filter(r => r.status === 'CRITICAL').length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Phone className="h-8 w-8 text-blue-600" />
            Reporte de Cobranza
          </h1>
          <p className="text-gray-600 mt-1">
            Gestión de pagos vencidos y próximos vencimientos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </Button>
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total por Cobrar</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${totalDue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredRecords.length} cuentas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cuentas Vencidas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{overdueCount}</div>
            <p className="text-xs text-muted-foreground">
              Requieren seguimiento
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Casos Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalCount}</div>
            <p className="text-xs text-muted-foreground">
              Atención inmediata
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Al Corriente</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {records.filter(r => r.status === 'CURRENT').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Clientes sin mora
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtrar por Estado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="CURRENT">Al Corriente</SelectItem>
                <SelectItem value="WARNING">Advertencia</SelectItem>
                <SelectItem value="OVERDUE">Vencido</SelectItem>
                <SelectItem value="CRITICAL">Crítico</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Collections List */}
      <Card>
        <CardHeader>
          <CardTitle>Cuentas por Cobrar</CardTitle>
          <CardDescription>
            {filteredRecords.length} registros encontrados
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Cargando reporte...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-12">
              <Phone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No se encontraron registros</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredRecords.map((record) => (
                <div
                  key={record.id}
                  className={`flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors ${getPriorityColor(record.status)}`}
                >
                  <div className="flex items-start gap-4 mb-3 md:mb-0">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Users className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-gray-900">
                          {record.clientName}
                        </p>
                        {getStatusBadge(record.status)}
                      </div>
                      <p className="text-sm text-gray-600 mb-1">
                        Préstamo: {record.loanId} • Asesor: {record.asesorName}
                      </p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {record.phoneNumber}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Vence: {new Date(record.nextPaymentDate).toLocaleDateString('es-ES')}
                        </span>
                        {record.daysOverdue > 0 && (
                          <span className="flex items-center gap-1 text-red-600 font-medium">
                            <Clock className="h-3 w-3" />
                            {record.daysOverdue} días de retraso
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-4">
                      <p className="text-2xl font-bold text-orange-600">
                        ${record.amountDue.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">Por cobrar</p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button size="sm" className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        Contactar
                      </Button>
                      <Button size="sm" variant="outline">
                        Ver Detalle
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
