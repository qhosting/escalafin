
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Loader2, 
  RefreshCw, 
  Plus, 
  MessageSquare, 
  CheckCircle2, 
  Clock, 
  XCircle,
  DollarSign,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface MessageRecharge {
  id: string;
  clientId: string;
  client: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  packageType: string;
  messageCount: number;
  amount: number;
  status: 'PENDING' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  paymentReference?: string;
  transferDate?: string;
  processedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface MessagePackage {
  id: string;
  name: string;
  messageCount: number;
  price: number;
  description: string;
}

export default function MessageRechargeManagement() {
  const [recharges, setRecharges] = useState<MessageRecharge[]>([]);
  const [packages, setPackages] = useState<MessagePackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRecharge, setSelectedRecharge] = useState<MessageRecharge | null>(null);

  // Estado para crear nueva recarga
  const [newRecharge, setNewRecharge] = useState({
    clientId: '',
    packageType: '',
    paymentReference: '',
  });

  useEffect(() => {
    loadRecharges();
    loadPackages();
  }, []);

  const loadRecharges = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/message-recharges');
      const data = await response.json();
      
      if (response.ok) {
        setRecharges(data.recharges || []);
      } else {
        toast.error('Error cargando recargas');
      }
    } catch (error) {
      console.error('Error cargando recargas:', error);
      toast.error('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const loadPackages = async () => {
    try {
      // Por ahora usamos paquetes predefinidos
      const defaultPackages: MessagePackage[] = [
        {
          id: 'package-100',
          name: 'Paquete Básico',
          messageCount: 100,
          price: 50,
          description: '100 mensajes WhatsApp'
        },
        {
          id: 'package-500',
          name: 'Paquete Estándar', 
          messageCount: 500,
          price: 200,
          description: '500 mensajes WhatsApp'
        },
        {
          id: 'package-1000',
          name: 'Paquete Premium',
          messageCount: 1000,
          price: 350,
          description: '1000 mensajes WhatsApp'
        }
      ];
      
      setPackages(defaultPackages);
    } catch (error) {
      console.error('Error cargando paquetes:', error);
    }
  };

  const updateRechargeStatus = async (rechargeId: string, status: string, paymentReference?: string) => {
    try {
      const response = await fetch(`/api/admin/message-recharges/${rechargeId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status,
          paymentReference,
          processedAt: status === 'COMPLETED' ? new Date().toISOString() : undefined
        })
      });

      if (response.ok) {
        toast.success('Estado actualizado correctamente');
        loadRecharges();
      } else {
        toast.error('Error actualizando estado');
      }
    } catch (error) {
      console.error('Error actualizando estado:', error);
      toast.error('Error interno del servidor');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'PAID':
        return <DollarSign className="w-4 h-4 text-blue-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'CANCELLED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'default';
      case 'PAID':
        return 'secondary';
      case 'PENDING':
        return 'outline';
      case 'CANCELLED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const filteredRecharges = recharges.filter(recharge => {
    const matchesSearch = 
      `${recharge.client.firstName} ${recharge.client.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recharge.client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recharge.client.phone.includes(searchTerm) ||
      (recharge.paymentReference && recharge.paymentReference.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || recharge.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Recargas de Mensajes</h1>
          <p className="text-muted-foreground">
            Administra las recargas de mensajes WhatsApp de los clientes
          </p>
        </div>
        <Button onClick={loadRecharges} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Actualizar
        </Button>
      </div>

      {/* Paquetes disponibles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium">{pkg.name}</span>
                <Badge variant="outline">${pkg.price} MXN</Badge>
              </div>
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  {pkg.messageCount} mensajes
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros y Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, email, teléfono o referencia..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="PENDING">Pendientes</SelectItem>
                <SelectItem value="PAID">Pagadas</SelectItem>
                <SelectItem value="COMPLETED">Completadas</SelectItem>
                <SelectItem value="CANCELLED">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de recargas */}
      <Card>
        <CardHeader>
          <CardTitle>Recargas ({filteredRecharges.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Paquete</TableHead>
                  <TableHead>Cantidad</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Referencia</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecharges.map((recharge) => (
                  <TableRow key={recharge.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {recharge.client.firstName} {recharge.client.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {recharge.client.email}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {recharge.client.phone}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{recharge.packageType}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="w-3 h-3" />
                        {recharge.messageCount}
                      </div>
                    </TableCell>
                    <TableCell>${recharge.amount} MXN</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(recharge.status)}
                        <Badge variant={getStatusBadgeVariant(recharge.status)}>
                          {recharge.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-xs">
                        {recharge.paymentReference || 'N/A'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>
                          {format(new Date(recharge.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                        </p>
                        {recharge.processedAt && (
                          <p className="text-xs text-muted-foreground">
                            Procesado: {format(new Date(recharge.processedAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        {recharge.status === 'PENDING' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateRechargeStatus(recharge.id, 'PAID')}
                          >
                            Marcar Pagado
                          </Button>
                        )}
                        {recharge.status === 'PAID' && (
                          <Button
                            size="sm"
                            onClick={() => updateRechargeStatus(recharge.id, 'COMPLETED')}
                          >
                            Completar
                          </Button>
                        )}
                        {(recharge.status === 'PENDING' || recharge.status === 'PAID') && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateRechargeStatus(recharge.id, 'CANCELLED')}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
