
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  Calendar,
  User,
  Activity,
  Shield,
  AlertTriangle,
  Info,
  Eye,
  Clock,
  FileText
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  timestamp: string;
  user?: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}

interface AuditStats {
  totalLogs: number;
  actionStats: Record<string, number>;
  userStats: Record<string, number>;
  dailyStats: Record<string, number>;
  topActions: [string, number][];
  topUsers: [string, number][];
}

const AuditLogViewer: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filtros
  const [filters, setFilters] = useState({
    action: '',
    userId: '',
    resource: '',
    startDate: '',
    endDate: '',
    search: '',
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const logsPerPage = 50;

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters, currentPage]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: logsPerPage.toString(),
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {} as Record<string, string>),
      });

      const response = await fetch(`/api/audit/logs?${params}`);
      if (!response.ok) throw new Error('Error al cargar logs');

      const data = await response.json();
      setLogs(data.logs);
      setTotalPages(Math.ceil(data.total / logsPerPage));
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Error al cargar los logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await fetch(`/api/audit/stats?${params}`);
      if (!response.ok) throw new Error('Error al cargar estadísticas');

      const statsData = await response.json();
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      userId: '',
      resource: '',
      startDate: '',
      endDate: '',
      search: '',
    });
    setCurrentPage(1);
  };

  const exportLogs = async () => {
    try {
      const params = new URLSearchParams({
        format: 'csv',
        ...Object.entries(filters).reduce((acc, [key, value]) => {
          if (value) acc[key] = value;
          return acc;
        }, {} as Record<string, string>),
      });

      const response = await fetch(`/api/audit/export?${params}`);
      if (!response.ok) throw new Error('Error al exportar logs');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Logs exportados exitosamente');
    } catch (error) {
      console.error('Error exporting logs:', error);
      toast.error('Error al exportar los logs');
    }
  };

  const getActionIcon = (action: string) => {
    const iconMap: Record<string, React.ReactNode> = {
      LOGIN: <User className="h-4 w-4 text-green-600" />,
      LOGOUT: <User className="h-4 w-4 text-gray-600" />,
      SIGNUP: <User className="h-4 w-4 text-blue-600" />,
      LOAN_CREATE: <FileText className="h-4 w-4 text-blue-600" />,
      LOAN_APPROVE: <Shield className="h-4 w-4 text-green-600" />,
      LOAN_REJECT: <AlertTriangle className="h-4 w-4 text-red-600" />,
      PAYMENT_CREATE: <Activity className="h-4 w-4 text-green-600" />,
      EXPORT_REPORT: <Download className="h-4 w-4 text-purple-600" />,
    };
    return iconMap[action] || <Info className="h-4 w-4 text-gray-600" />;
  };

  const getActionBadgeVariant = (action: string) => {
    if (action.includes('APPROVE')) return 'default';
    if (action.includes('REJECT') || action.includes('DELETE')) return 'destructive';
    if (action.includes('CREATE')) return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sistema de Auditoría
          </CardTitle>
          <CardDescription>
            Registro completo de todas las actividades del sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="logs" className="space-y-4">
            <TabsList>
              <TabsTrigger value="logs">Logs de Auditoría</TabsTrigger>
              <TabsTrigger value="stats">Estadísticas</TabsTrigger>
              <TabsTrigger value="filters">Filtros Avanzados</TabsTrigger>
            </TabsList>

            <TabsContent value="logs" className="space-y-4">
              {/* Controles superiores */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar en logs..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select
                    value={filters.action}
                    onValueChange={(value) => handleFilterChange('action', value)}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Acción" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="LOGIN">Login</SelectItem>
                      <SelectItem value="LOGOUT">Logout</SelectItem>
                      <SelectItem value="LOAN_CREATE">Crear Préstamo</SelectItem>
                      <SelectItem value="LOAN_APPROVE">Aprobar Préstamo</SelectItem>
                      <SelectItem value="PAYMENT_CREATE">Crear Pago</SelectItem>
                      <SelectItem value="EXPORT_REPORT">Exportar Reporte</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={clearFilters}>
                    <Filter className="h-4 w-4 mr-2" />
                    Limpiar
                  </Button>
                  <Button variant="outline" onClick={fetchLogs}>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Actualizar
                  </Button>
                  <Button variant="outline" onClick={exportLogs}>
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </div>

              {/* Tabla de logs */}
              {loading ? (
                <div className="flex items-center justify-center h-64">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-16">Acción</TableHead>
                        <TableHead>Usuario</TableHead>
                        <TableHead>Recurso</TableHead>
                        <TableHead>IP</TableHead>
                        <TableHead>Fecha</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getActionIcon(log.action)}
                              <Badge variant={getActionBadgeVariant(log.action)}>
                                {log.action}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">
                                {log.user?.name || log.userEmail || 'Sistema'}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {log.user?.role}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium">{log.resource || '-'}</div>
                              {log.resourceId && (
                                <div className="text-sm text-muted-foreground font-mono">
                                  ID: {log.resourceId}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {log.ipAddress || '-'}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 text-sm">
                              <Clock className="h-3 w-3" />
                              {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedLog(log)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Paginación */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="stats" className="space-y-4">
              {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Total de Eventos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.totalLogs}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Usuarios Activos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Object.keys(stats.userStats).length}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Días con Actividad</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Object.keys(stats.dailyStats).length}</div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Tipos de Eventos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{Object.keys(stats.actionStats).length}</div>
                    </CardContent>
                  </Card>
                </div>
              )}

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top Acciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats?.topActions.slice(0, 10).map(([action, count]) => (
                        <div key={action} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getActionIcon(action)}
                            <span className="text-sm">{action}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Usuarios Más Activos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats?.topUsers.slice(0, 10).map(([userId, count]) => (
                        <div key={userId} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="text-sm">{userId}</span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="userId">Usuario ID</Label>
                  <Input
                    id="userId"
                    value={filters.userId}
                    onChange={(e) => handleFilterChange('userId', e.target.value)}
                    placeholder="ID del usuario"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resource">Recurso</Label>
                  <Input
                    id="resource"
                    value={filters.resource}
                    onChange={(e) => handleFilterChange('resource', e.target.value)}
                    placeholder="Nombre del recurso"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startDate">Fecha Inicio</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={filters.startDate}
                    onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endDate">Fecha Fin</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={filters.endDate}
                    onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  />
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Los filtros se aplican automáticamente. Use los campos de fechas para limitar 
                  el rango temporal de los logs mostrados.
                </AlertDescription>
              </Alert>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Modal de detalles */}
      {selectedLog && (
        <Card>
          <CardHeader>
            <CardTitle>Detalles del Log</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedLog(null)}
              className="absolute right-4 top-4"
            >
              ×
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">ID del Log</Label>
                <p className="font-mono text-sm">{selectedLog.id}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">Fecha y Hora</Label>
                <p className="text-sm">
                  {format(new Date(selectedLog.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">Acción</Label>
                <div className="flex items-center gap-2">
                  {getActionIcon(selectedLog.action)}
                  <Badge variant={getActionBadgeVariant(selectedLog.action)}>
                    {selectedLog.action}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium">Usuario</Label>
                <p className="text-sm">
                  {selectedLog.user?.name || selectedLog.userEmail || 'Sistema'}
                </p>
              </div>
            </div>

            {selectedLog.resource && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Recurso</Label>
                  <p className="text-sm">{selectedLog.resource}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">ID del Recurso</Label>
                  <p className="font-mono text-sm">{selectedLog.resourceId || 'N/A'}</p>
                </div>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-sm font-medium">Dirección IP</Label>
                <p className="font-mono text-sm">{selectedLog.ipAddress || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-sm font-medium">User Agent</Label>
                <p className="text-xs text-muted-foreground truncate">
                  {selectedLog.userAgent || 'N/A'}
                </p>
              </div>
            </div>

            {selectedLog.details && (
              <div>
                <Label className="text-sm font-medium">Detalles</Label>
                <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-64">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditLogViewer;
