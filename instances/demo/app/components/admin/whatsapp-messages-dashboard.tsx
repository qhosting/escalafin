
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Loader2, 
  MessageSquare, 
  Search, 
  Filter, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle,
  RefreshCw,
  Send
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface WhatsAppMessage {
  id: string;
  phone: string;
  messageType: string;
  status: string;
  message: string;
  sentAt?: string;
  errorMessage?: string;
  createdAt: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string;
    email?: string;
  };
}

interface MessageStats {
  total: number;
  sent: number;
  pending: number;
  failed: number;
  delivered: number;
}

export default function WhatsAppMessagesDashboard() {
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [stats, setStats] = useState<MessageStats>({
    total: 0,
    sent: 0,
    pending: 0,
    failed: 0,
    delivered: 0
  });
  
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadMessages();
  }, [currentPage, statusFilter, typeFilter]);

  useEffect(() => {
    calculateStats();
  }, [messages]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20'
      });

      if (statusFilter !== 'all') {
        params.append('status', statusFilter);
      }
      
      if (typeFilter !== 'all') {
        params.append('messageType', typeFilter);
      }

      const response = await fetch(`/api/admin/whatsapp-notifications?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setMessages(data.messages || []);
        setTotalPages(data.pagination?.totalPages || 1);
      } else {
        toast.error('Error cargando mensajes');
      }
    } catch (error) {
      console.error('Error cargando mensajes:', error);
      toast.error('Error interno del servidor');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = () => {
    const stats = messages.reduce(
      (acc, message) => {
        acc.total++;
        switch (message.status) {
          case 'SENT':
            acc.sent++;
            break;
          case 'PENDING':
            acc.pending++;
            break;
          case 'FAILED':
            acc.failed++;
            break;
          case 'DELIVERED':
            acc.delivered++;
            break;
        }
        return acc;
      },
      { total: 0, sent: 0, pending: 0, failed: 0, delivered: 0 }
    );
    
    setStats(stats);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SENT':
        return <CheckCircle2 className="w-4 h-4 text-green-500" />;
      case 'DELIVERED':
        return <CheckCircle2 className="w-4 h-4 text-blue-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'SENT':
      case 'DELIVERED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'FAILED':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getMessageTypeLabel = (type: string) => {
    switch (type) {
      case 'PAYMENT_RECEIVED':
        return 'Pago Recibido';
      case 'PAYMENT_REMINDER':
        return 'Recordatorio';
      case 'LOAN_APPROVED':
        return 'Préstamo Aprobado';
      case 'LOAN_UPDATE':
        return 'Actualización';
      case 'MARKETING':
        return 'Marketing';
      case 'CUSTOM':
        return 'Personalizado';
      default:
        return type;
    }
  };

  const filteredMessages = messages.filter(message =>
    `${message.client.firstName} ${message.client.lastName}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
    message.phone.includes(searchTerm) ||
    message.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Dashboard de Mensajes WhatsApp</h1>
          <p className="text-muted-foreground">
            Monitorea y gestiona todos los mensajes de WhatsApp enviados
          </p>
        </div>
        <Button onClick={loadMessages} disabled={loading}>
          {loading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Actualizar
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Enviados</span>
            </div>
            <p className="text-2xl font-bold">{stats.sent}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Entregados</span>
            </div>
            <p className="text-2xl font-bold">{stats.delivered}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-yellow-500" />
              <span className="text-sm font-medium">Pendientes</span>
            </div>
            <p className="text-2xl font-bold">{stats.pending}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <XCircle className="w-4 h-4 text-red-500" />
              <span className="text-sm font-medium">Fallidos</span>
            </div>
            <p className="text-2xl font-bold">{stats.failed}</p>
          </CardContent>
        </Card>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, teléfono o mensaje..."
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
                <SelectItem value="SENT">Enviados</SelectItem>
                <SelectItem value="DELIVERED">Entregados</SelectItem>
                <SelectItem value="FAILED">Fallidos</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de mensaje" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los tipos</SelectItem>
                <SelectItem value="PAYMENT_RECEIVED">Pago Recibido</SelectItem>
                <SelectItem value="PAYMENT_REMINDER">Recordatorio</SelectItem>
                <SelectItem value="LOAN_APPROVED">Préstamo Aprobado</SelectItem>
                <SelectItem value="LOAN_UPDATE">Actualización</SelectItem>
                <SelectItem value="MARKETING">Marketing</SelectItem>
                <SelectItem value="CUSTOM">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Mensajes */}
      <Card>
        <CardHeader>
          <CardTitle>Mensajes ({filteredMessages.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Teléfono</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Mensaje</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMessages.map((message) => (
                    <TableRow key={message.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {message.client.firstName} {message.client.lastName}
                          </p>
                          {message.client.email && (
                            <p className="text-xs text-muted-foreground">
                              {message.client.email}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{message.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getMessageTypeLabel(message.messageType)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(message.status)}
                          <Badge variant={getStatusBadgeVariant(message.status)}>
                            {message.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-xs">
                          <p className="truncate text-sm">
                            {message.message}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {format(new Date(message.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })}
                          </p>
                          {message.sentAt && (
                            <p className="text-xs text-muted-foreground">
                              Enviado: {format(new Date(message.sentAt), 'HH:mm', { locale: es })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {message.errorMessage && (
                          <div className="max-w-xs">
                            <p className="text-xs text-red-600 truncate">
                              {message.errorMessage}
                            </p>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage <= 1}
                  >
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Página {currentPage} de {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage >= totalPages}
                  >
                    Siguiente
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
