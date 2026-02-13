

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, Phone, Mail, MapPin, Plus, Search } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  documentNumber: string;
  status: string;
  totalLoans: number;
  totalAmount: number;
  createdAt: string;
}

interface ClientListProps {
  userRole?: string;
}

export function ClientList({ userRole = 'ADMIN' }: ClientListProps) {
  const { data: session } = useSession() || {};
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await fetch('/api/clients');
      if (!response.ok) throw new Error('Error al cargar clientes');

      const data = await response.json();
      // Handle both array and object responses
      const clientsData = Array.isArray(data) ? data : (data.clients || []);

      // Transform data if needed (api returns firstName/lastName, component expects name)
      const transformedClients = clientsData.map((c: any) => ({
        ...c,
        name: c.firstName && c.lastName ? `${c.firstName} ${c.lastName}` : (c.name || 'Sin nombre'),
        documentNumber: c.accountNumber || 'N/A', // Using accountNumber as documentNumber placeholder
        totalLoans: c.loans?.length || 0,
        totalAmount: c.loans?.reduce((acc: number, l: any) => acc + (l.balanceRemaining || 0), 0) || 0
      }));

      setClients(transformedClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(client =>
    client.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (client.documentNumber && client.documentNumber.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {userRole === 'ASESOR' ? 'Mis Clientes' : 'Gestión de Clientes'}
          </h1>
          <p className="text-gray-600">
            {userRole === 'ASESOR'
              ? 'Administra tu cartera de clientes asignados'
              : 'Administra todos los clientes del sistema'
            }
          </p>
        </div>
        <Link href="/admin/clients/new">
          <Button className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo Cliente
          </Button>
        </Link>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o documento..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                <p className="text-sm text-gray-600">Total Clientes</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <Building2 className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {clients.filter(c => c.status === 'ACTIVO').length}
                </p>
                <p className="text-sm text-gray-600">Clientes Activos</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  ${clients.reduce((sum, c) => sum + c.totalAmount, 0).toLocaleString()}
                </p>
                <p className="text-sm text-gray-600">Cartera Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Lista de Clientes ({filteredClients.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron clientes</h3>
              <p className="text-gray-600">
                {searchTerm ? 'No hay clientes que coincidan con tu búsqueda' : 'No hay clientes registrados'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredClients.map((client) => (
                <div key={client.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-blue-100 rounded-lg">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900">{client.name}</h3>
                          <Badge variant={client.status === 'ACTIVO' ? 'default' : 'secondary'}>
                            {client.status}
                          </Badge>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            {client.email}
                          </div>
                          {client.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-4 h-4" />
                              {client.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4" />
                            Documento: {client.documentNumber}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right text-sm">
                        <p className="font-medium text-gray-900">
                          ${client.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-gray-600">
                          {client.totalLoans} préstamos
                        </p>
                      </div>
                      <Link href={`/admin/clients/${client.id}`}>
                        <Button variant="outline" size="sm">
                          Ver Detalles
                        </Button>
                      </Link>
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

