
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  CreditCard,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface Client {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  status: string;
  creditScore?: number;
  _count?: {
    loans: number;
  };
}

export default function MobileClientsPage() {
  const { data: session } = useSession() || {};
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const searchClients = async () => {
    if (!searchTerm.trim()) {
      toast.error('Ingresa un término de búsqueda');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/clients/search?q=${encodeURIComponent(searchTerm)}&limit=20`);
      if (!response.ok) throw new Error('Error en la búsqueda');

      const data = await response.json();
      setClients(data.clients || []);
      
      if (data.clients?.length === 0) {
        toast.info('No se encontraron clientes que coincidan');
      }
    } catch (error) {
      console.error('Error searching clients:', error);
      toast.error('Error al buscar clientes');
    } finally {
      setLoading(false);
    }
  };

  const callClient = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`);
    } else {
      toast.error('Teléfono no disponible');
    }
  };

  const emailClient = (email: string) => {
    if (email) {
      window.open(`mailto:${email}`);
    } else {
      toast.error('Email no disponible');
    }
  };

  const openMaps = (address: string) => {
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
    } else {
      toast.error('Dirección no disponible');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Búsqueda de Clientes
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Busca y contacta clientes rápidamente
        </p>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Buscar Cliente</CardTitle>
          <CardDescription>
            Busca por nombre, teléfono, email o cédula
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Nombre, teléfono, email o cédula..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchClients()}
            />
            <Button onClick={searchClients} disabled={loading}>
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {clients.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">
            Resultados ({clients.length})
          </h2>
          
          {clients.map((client) => (
            <Card key={client.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-lg">
                      {client.firstName} {client.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Cliente
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={client.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {client.status}
                      </Badge>
                      {client._count && (
                        <Badge variant="outline">
                          {client._count.loans} préstamo{client._count.loans !== 1 ? 's' : ''}
                        </Badge>
                      )}
                    </div>
                  </div>
                  {client.creditScore && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Score</p>
                      <p className="text-lg font-bold text-blue-600">
                        {client.creditScore}
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-2 mb-4 text-sm">
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{client.email}</span>
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span>{client.phone}</span>
                    </div>
                  )}
                  {client.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">{client.address}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  {client.phone && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => callClient(client.phone!)}
                      className="flex items-center gap-2"
                    >
                      <Phone className="h-4 w-4" />
                      Llamar
                    </Button>
                  )}
                  
                  {client.email && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => emailClient(client.email)}
                      className="flex items-center gap-2"
                    >
                      <Mail className="h-4 w-4" />
                      Email
                    </Button>
                  )}
                  
                  {client.address && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => openMaps(client.address!)}
                      className="flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Ubicación
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {clients.length === 0 && !loading && searchTerm && (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              No se encontraron clientes que coincidan con tu búsqueda
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
