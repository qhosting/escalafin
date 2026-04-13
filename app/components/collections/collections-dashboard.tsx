
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { MapPin, Calendar, User, Navigation, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CollectionsDashboard() {
  const [routes, setRoutes] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [rRes, sRes] = await Promise.all([
        fetch('/api/collections/routes'),
        fetch('/api/collections/summary?period=month')
      ]);
      const rData = await rRes.json();
      const sData = await sRes.json();
      setRoutes(rData.routes || []);
      setSummary(sData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las rutas de cobranza',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge className="bg-green-500">Completada</Badge>;
      case 'IN_PROGRESS': return <Badge className="bg-blue-500">En Progreso</Badge>;
      case 'CANCELLED': return <Badge variant="destructive">Cancelada</Badge>;
      default: return <Badge variant="secondary">Pendiente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Cobranza</h2>
          <p className="text-muted-foreground">Rutas optimizadas y seguimiento de visitas.</p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" /> Nueva Ruta
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Visitas del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.totalVisits || 0}</div>
            <p className="text-xs text-green-500 mt-1">{summary?.completedVisits || 0} completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Efectividad</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary?.visitCompletionRate || 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Tasa de visitas completadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground uppercase">Promesas Recibidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${summary?.totalPromised?.toLocaleString() || 0}</div>
            <p className="text-xs text-blue-500 mt-1">{summary?.totalPromises || 0} promesas registradas</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Rutas de Cobranza Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ruta / Asesor</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Visitas</TableHead>
                <TableHead>Distancia</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell>
                </TableRow>
              ) : routes.length > 0 ? (
                routes.map((route) => (
                  <TableRow key={route.id}>
                    <TableCell>
                      <div className="font-medium">{route.name}</div>
                      <div className="text-xs text-muted-foreground">{route.advisor.firstName} {route.advisor.lastName}</div>
                    </TableCell>
                    <TableCell>{new Date(route.date).toLocaleDateString()}</TableCell>
                    <TableCell>{route.visits.length} visitas</TableCell>
                    <TableCell>{(route.distance / 1000).toFixed(1)} km</TableCell>
                    <TableCell>{getStatusBadge(route.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">Ver Detalles</Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay rutas registradas.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
