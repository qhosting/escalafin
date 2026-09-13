'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Search,
  Filter,
  Download,
  RefreshCw,
  User,
  Activity,
  Shield,
  AlertTriangle,
  Info,
  Eye,
  Clock,
  FileText,
  Calendar,
  Layers,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Building2
} from 'lucide-react';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useSearchParams } from 'next/navigation';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';

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
  tenantName?: string;
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
  const searchParams = useSearchParams();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('logs');
  const [showFilters, setShowFilters] = useState(false);

  const { data: session } = useSession();
  const isSuperAdmin = (session?.user as any)?.role === 'SUPER_ADMIN';

  // Filtros
  const [filters, setFilters] = useState({
    action: 'all',
    userId: '',
    resource: '',
    startDate: '',
    endDate: '',
    search: searchParams.get('search') || '',
    tenantId: searchParams.get('tenantId') || '',
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
          if (value && value !== 'all') acc[key] = value;
          return acc;
        }, {} as Record<string, string>),
      });

      const response = await fetch(`/api/audit/logs?${params}`);
      if (!response.ok) throw new Error('Error al cargar logs');

      const data = await response.json();
      setLogs(data.logs || []);
      setTotalPages(Math.max(1, Math.ceil((data.total || 0) / logsPerPage)));
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
      action: 'all',
      userId: '',
      resource: '',
      startDate: '',
      endDate: '',
      search: '',
      tenantId: '',
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

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    toast.success('Copiado al portapapeles');
    setTimeout(() => setCopiedText(null), 2000);
  };

  const getActionBadge = (action: string) => {
    if (action.includes('APPROVE') || action.includes('SUCCESS') || action === 'LOGIN') {
      return (
        <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-semibold">
          {action}
        </Badge>
      );
    }
    if (action.includes('REJECT') || action.includes('DELETE') || action.includes('BLOCK')) {
      return (
        <Badge variant="destructive" className="text-[10px] font-mono font-semibold">
          {action}
        </Badge>
      );
    }
    if (action.includes('CREATE') || action.includes('PAYMENT')) {
      return (
        <Badge className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-500/30 text-[10px] font-mono font-semibold">
          {action}
        </Badge>
      );
    }
    if (action.includes('UPDATE')) {
      return (
        <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-mono font-semibold">
          {action}
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-[10px] font-mono text-muted-foreground">
        {action}
      </Badge>
    );
  };

  const hasActiveFilters = Boolean(
    (filters.action && filters.action !== 'all') ||
    filters.userId ||
    filters.resource ||
    filters.startDate ||
    filters.endDate ||
    filters.search
  );

  return (
    <div className="space-y-6">
      {/* 1. Toolbar de Control y Filtros Rápidos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar en eventos..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="h-8 pl-8 text-xs bg-background"
            />
          </div>

          <Select
            value={filters.action}
            onValueChange={(value) => handleFilterChange('action', value)}
          >
            <SelectTrigger className="h-8 w-40 text-xs bg-background">
              <SelectValue placeholder="Acción" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las Acciones</SelectItem>
              <SelectItem value="LOGIN">LOGIN</SelectItem>
              <SelectItem value="LOGOUT">LOGOUT</SelectItem>
              <SelectItem value="LOAN_CREATE">Crear Préstamo</SelectItem>
              <SelectItem value="LOAN_APPROVE">Aprobar Préstamo</SelectItem>
              <SelectItem value="PAYMENT_CREATE">Registrar Pago</SelectItem>
              <SelectItem value="CLIENT_CREATE">Nuevo Cliente</SelectItem>
              <SelectItem value="USER_CREATE">Nuevo Usuario</SelectItem>
              <SelectItem value="EXPORT_REPORT">Exportación</SelectItem>
              <SelectItem value="SECURITY_BLOCK">Bloqueo WAF</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className={cn("h-8 gap-1.5 text-xs font-medium", hasActiveFilters && "border-primary/50 text-primary")}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            <span>Filtros</span>
            {hasActiveFilters && (
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </Button>

          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
            >
              Limpiar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchLogs}
            disabled={loading}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin")} />
            <span className="hidden sm:inline">Actualizar</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={exportLogs}
            className="h-8 gap-1.5 text-xs font-medium"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Exportar CSV</span>
          </Button>
        </div>
      </div>

      {/* Panel Expandible de Filtros Avanzados */}
      {showFilters && (
        <Card className="border border-border/80 shadow-xs p-4 rounded-xl bg-card/60 animate-in fade-in-50 duration-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                ID de Usuario
              </label>
              <Input
                value={filters.userId}
                onChange={(e) => handleFilterChange('userId', e.target.value)}
                placeholder="Filtrar por User ID..."
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Tipo de Recurso
              </label>
              <Input
                value={filters.resource}
                onChange={(e) => handleFilterChange('resource', e.target.value)}
                placeholder="Ej. Loan, Client, Payment..."
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Fecha Inicio
              </label>
              <Input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Fecha Fin
              </label>
              <Input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="h-8 text-xs"
              />
            </div>
          </div>
        </Card>
      )}

      {/* 2. KPI Cards de Auditoría */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Total de Eventos</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {stats?.totalLogs ?? logs.length}
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Shield className="h-3 w-3 text-primary" />
                Inmutabilidad y trazabilidad
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <FileText className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Usuarios Auditados</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {stats ? Object.keys(stats.userStats).length : 0}
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3 text-blue-500" />
                Sesiones y acciones únicas
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <User className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Tipos de Operación</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {stats ? Object.keys(stats.actionStats).length : 0}
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Activity className="h-3 w-3 text-emerald-500" />
                Catálogo de acciones
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Activity className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/80 shadow-xs hover:border-primary/40 transition-colors">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Días con Actividad</p>
              <p className="text-2xl font-bold tracking-tight text-foreground">
                {stats ? Object.keys(stats.dailyStats).length : 0}
              </p>
              <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3 text-amber-500" />
                Historial continuo
              </p>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Calendar className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Pestañas: Logs vs Estadísticas */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-4">
        <TabsList className="h-10 bg-muted/60 p-1 rounded-xl border border-border/60">
          <TabsTrigger value="logs" className="gap-2 rounded-lg text-xs font-medium">
            <FileText className="h-3.5 w-3.5" />
            <span>Registro de Auditoría</span>
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 ml-1">
              {logs.length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="stats" className="gap-2 rounded-lg text-xs font-medium">
            <Activity className="h-3.5 w-3.5" />
            <span>Métricas & Desglose</span>
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: Tabla de Logs */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="border border-border/80 shadow-xs overflow-hidden">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <LoadingSpinner size="md" />
                  <p className="text-xs text-muted-foreground">Cargando registros de auditoría...</p>
                </div>
              ) : logs.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="w-36 text-xs">Acción</TableHead>
                        {isSuperAdmin && <TableHead className="text-xs">Organización</TableHead>}
                        <TableHead className="text-xs">Usuario</TableHead>
                        <TableHead className="text-xs">Recurso Afectado</TableHead>
                        <TableHead className="text-xs">IP Origen</TableHead>
                        <TableHead className="text-xs">Fecha / Hora</TableHead>
                        <TableHead className="w-12 text-center text-xs"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logs.map((log) => (
                        <TableRow key={log.id} className="hover:bg-muted/30 transition-colors">
                          <TableCell className="py-3">
                            {getActionBadge(log.action)}
                          </TableCell>

                          {isSuperAdmin && (
                            <TableCell className="py-3">
                              <span className="text-xs font-medium text-muted-foreground">
                                {log.tenantName || 'Global'}
                              </span>
                            </TableCell>
                          )}

                          <TableCell className="py-3">
                            <div className="space-y-0.5">
                              <p className="text-xs font-semibold text-foreground">
                                {log.user?.name || log.userEmail || 'Sistema'}
                              </p>
                              {log.user?.role && (
                                <span className="text-[10px] text-muted-foreground font-mono">
                                  {log.user.role}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="space-y-0.5">
                              <p className="text-xs font-medium text-foreground">
                                {log.resource || '-'}
                              </p>
                              {log.resourceId && (
                                <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[150px] block">
                                  #{log.resourceId}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          <TableCell className="py-3 font-mono text-xs text-muted-foreground">
                            {log.ipAddress || '-'}
                          </TableCell>

                          <TableCell className="py-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
                                <Clock className="h-3 w-3 text-muted-foreground" />
                                <span>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm', { locale: es })}</span>
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: es })}
                              </span>
                            </div>
                          </TableCell>

                          <TableCell className="py-3 text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-foreground"
                              onClick={() => setSelectedLog(log)}
                              title="Ver detalles completos del evento"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="py-16 text-center flex flex-col items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-foreground">Sin eventos registrados</p>
                    <p className="text-xs text-muted-foreground">
                      No se encontraron registros que coincidan con los filtros aplicados.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>

            {/* Paginación */}
            {totalPages > 1 && (
              <div className="p-3 border-t border-border/80 flex items-center justify-between bg-card">
                <p className="text-xs text-muted-foreground">
                  Página <span className="font-semibold text-foreground">{currentPage}</span> de{' '}
                  <span className="font-semibold text-foreground">{totalPages}</span>
                </p>

                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="h-7 text-xs px-2.5"
                  >
                    <ChevronLeft className="h-3.5 w-3.5 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="h-7 text-xs px-2.5"
                  >
                    Siguiente
                    <ChevronRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        {/* TAB 2: Estadísticas & Desglose */}
        <TabsContent value="stats" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top Acciones */}
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="px-5 py-4 border-b border-border/60">
                <CardTitle className="text-sm font-semibold">Operaciones Más Recurrentes</CardTitle>
                <CardDescription className="text-xs">Distribución de acciones registradas</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2.5">
                  {stats?.topActions.slice(0, 10).map(([action, count]) => (
                    <div key={action} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-2">
                        {getActionBadge(action)}
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {count} eventos
                      </Badge>
                    </div>
                  ))}
                  {(!stats || stats.topActions.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-6">No hay estadísticas de acciones disponibles.</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Usuarios */}
            <Card className="border border-border/80 shadow-xs">
              <CardHeader className="px-5 py-4 border-b border-border/60">
                <CardTitle className="text-sm font-semibold">Usuarios con Mayor Actividad</CardTitle>
                <CardDescription className="text-xs">Volumen de operaciones por identificador</CardDescription>
              </CardHeader>
              <CardContent className="p-4">
                <div className="space-y-2.5">
                  {stats?.topUsers.slice(0, 10).map(([userId, count]) => (
                    <div key={userId} className="flex items-center justify-between text-xs p-2 rounded-lg bg-muted/40 hover:bg-muted/70 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <User className="h-3.5 w-3.5" />
                        </div>
                        <span className="font-mono text-xs text-foreground truncate max-w-[200px]">{userId}</span>
                      </div>
                      <Badge variant="secondary" className="font-mono text-xs">
                        {count} ops
                      </Badge>
                    </div>
                  ))}
                  {(!stats || stats.topUsers.length === 0) && (
                    <p className="text-xs text-muted-foreground text-center py-6">No hay estadísticas de usuarios disponibles.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* 4. Modal Profesional de Detalle del Evento (Dialog Radix) */}
      <Dialog open={Boolean(selectedLog)} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-xl p-0 overflow-hidden">
          <DialogHeader className="p-5 pb-3 border-b border-border/80">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  <span>Detalle de Evento de Auditoría</span>
                  {selectedLog && getActionBadge(selectedLog.action)}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  Registro inmutable de trazabilidad de operaciones.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {selectedLog && (
            <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-muted/40 border border-border/60">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    ID del Registro
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <code className="font-mono text-foreground">{selectedLog.id}</code>
                    <button
                      onClick={() => handleCopy(selectedLog.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {copiedText === selectedLog.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                    </button>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Fecha y Hora
                  </span>
                  <p className="font-medium text-foreground mt-0.5">
                    {format(new Date(selectedLog.timestamp), 'dd/MM/yyyy HH:mm:ss', { locale: es })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Usuario
                  </span>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedLog.user?.name || selectedLog.userEmail || 'Sistema'}
                  </p>
                  {selectedLog.user?.role && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Rol: {selectedLog.user.role}
                    </span>
                  )}
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Recurso Afectado
                  </span>
                  <p className="font-medium text-foreground mt-0.5">
                    {selectedLog.resource || 'N/A'}
                  </p>
                  {selectedLog.resourceId && (
                    <span className="text-[10px] text-muted-foreground font-mono">
                      ID: {selectedLog.resourceId}
                    </span>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Dirección IP
                  </span>
                  <code className="font-mono text-foreground mt-0.5 block">{selectedLog.ipAddress || 'Desconocida'}</code>
                </div>

                <div>
                  <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider block">
                    Navegador / User Agent
                  </span>
                  <p className="text-[11px] text-muted-foreground truncate mt-0.5" title={selectedLog.userAgent}>
                    {selectedLog.userAgent || 'No especificado'}
                  </p>
                </div>
              </div>

              {selectedLog.details && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Payload & Metadatos
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => handleCopy(JSON.stringify(selectedLog.details, null, 2))}
                    >
                      Copiar JSON
                    </Button>
                  </div>
                  <pre className="p-3 rounded-lg bg-muted/70 border border-border/60 text-[11px] font-mono overflow-x-auto max-h-52 text-foreground/90 scrollbar-thin">
                    {typeof selectedLog.details === 'string'
                      ? selectedLog.details
                      : JSON.stringify(selectedLog.details, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AuditLogViewer;
