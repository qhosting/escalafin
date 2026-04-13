
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ShieldCheck, ShieldAlert, FileText, User, Check, X, Eye, Loader2, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function KYCReviewPanel() {
  const [verifications, setVerifications] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [vRes, sRes] = await Promise.all([
        fetch('/api/verification'),
        fetch('/api/verification/dashboard')
      ]);
      const vData = await vRes.json();
      const sData = await sRes.json();
      setVerifications(vData.verifications || []);
      setStats(sData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar los datos de verificación',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualAction = async (id: string, approved: boolean) => {
    try {
      const response = await fetch(`/api/verification/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'MANUAL_VERIFY',
          approved,
          rejectionReason: approved ? null : 'Documentación no clara o inválida'
        }),
      });
      if (response.ok) {
        toast({ title: 'Éxito', description: `Verificación ${approved ? 'aprobada' : 'rechazada'}` });
        fetchData();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Error al procesar la acción', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'VERIFIED': return <Badge className="bg-green-500">Verificado</Badge>;
      case 'REJECTED': return <Badge variant="destructive">Rechazado</Badge>;
      case 'IN_PROGRESS': return <Badge className="bg-amber-500">En Proceso</Badge>;
      default: return <Badge variant="outline">Pendiente</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Verificación de Identidad (KYC)</h2>
          <p className="text-muted-foreground">Validación de documentos y biometría de clientes.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase">Índice de Verificación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.verificationRate || 0}%</div>
            <p className="text-xs text-muted-foreground">{stats?.verifiedClients || 0} de {stats?.totalClients || 0} clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats?.pending || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase">Rechazados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats?.rejected || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium uppercase">En Proceso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats?.inProgress || 0}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Solicitudes de Verificación</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo Documento</TableHead>
                <TableHead>Biometría</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" /></TableCell>
                </TableRow>
              ) : verifications.length > 0 ? (
                verifications.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="font-medium">
                      {v.client.firstName} {v.client.lastName}
                    </TableCell>
                    <TableCell>{v.documentType}</TableCell>
                    <TableCell>
                      {v.biometricScore ? (
                        <div className="flex items-center gap-1">
                          <div className={`h-2 w-12 rounded-full bg-muted overflow-hidden`}>
                            <div className={`h-full ${v.biometricScore > 0.8 ? 'bg-green-500' : 'bg-amber-500'}`} style={{ width: `${v.biometricScore * 100}%` }} />
                          </div>
                          <span className="text-xs">{(v.biometricScore * 100).toFixed(0)}%</span>
                        </div>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>{new Date(v.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>{getStatusBadge(v.status)}</TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button variant="ghost" size="icon" title="Ver Documentos"><Eye className="h-4 w-4" /></Button>
                      {v.status !== 'VERIFIED' && (
                        <Button variant="ghost" size="icon" onClick={() => handleManualAction(v.id, true)} className="text-green-600">
                          <Check className="h-4 w-4" />
                        </Button>
                      )}
                      {v.status !== 'REJECTED' && (
                        <Button variant="ghost" size="icon" onClick={() => handleManualAction(v.id, false)} className="text-destructive">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No hay solicitudes de verificación pendientes.
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
