
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Percent, TrendingUp, Users, Wallet, Plus, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function CommissionsDashboard() {
  const [records, setRecords] = useState<any[]>([]);
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
        fetch('/api/commissions'),
        fetch('/api/commissions/dashboard?period=month')
      ]);
      const rData = await rRes.json();
      const sData = await sRes.json();
      setRecords(rData.records || rData.commissions || []);
      setSummary(sData);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudieron cargar las comisiones',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Comisiones</h2>
          <p className="text-muted-foreground">Control y pago de comisiones para asesores.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Configurar Esquemas</Button>
          <Button className="gap-2">Aprobar Lote</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">
              ${(summary?.pendingAmount || records.filter(r => r.status === 'PENDING').reduce((s, r) => s + Number(r.amount), 0)).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Aprobadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${(summary?.approvedAmount || records.filter(r => r.status === 'APPROVED').reduce((s, r) => s + Number(r.amount), 0)).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Pagadas (Mes)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${(summary?.paidAmount || records.filter(r => r.status === 'PAID').reduce((s, r) => s + Number(r.amount), 0)).toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total General</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${(summary?.totalAmount || records.reduce((s, r) => s + Number(r.amount), 0)).toLocaleString()}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registro de Comisiones</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asesor</TableHead>
                <TableHead>Concepto</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">Cargando...</TableCell>
                </TableRow>
              ) : records.length > 0 ? (
                records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.advisor.firstName} {record.advisor.lastName}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{record.schema.name}</div>
                      <div className="text-xs text-muted-foreground">{record.sourceType}</div>
                    </TableCell>
                    <TableCell>{new Date(record.calculatedAt).toLocaleDateString()}</TableCell>
                    <TableCell className="font-bold">${Number(record.amount).toLocaleString()}</TableCell>
                    <TableCell>
                      {record.status === 'PAID' ? (
                        <Badge className="bg-green-500">Pagado</Badge>
                      ) : record.status === 'APPROVED' ? (
                        <Badge className="bg-blue-500">Aprobado</Badge>
                      ) : (
                        <Badge variant="outline">Pendiente</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {record.status === 'PENDING' && (
                        <Button variant="ghost" size="sm" className="text-blue-600">Aprobar</Button>
                      )}
                      {record.status === 'APPROVED' && (
                        <Button variant="ghost" size="sm" className="text-green-600">Pagar</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No se han generado comisiones aún.
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
