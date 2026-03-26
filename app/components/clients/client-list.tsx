

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
                <div 
                  key={client.id} 
                  className="p-6 border-2 border-gray-100 dark:border-gray-800 rounded-[2rem] hover:border-blue-200 dark:hover:border-blue-900 transition-all hover:bg-blue-50/30 dark:hover:bg-blue-900/10 group shadow-sm hover:shadow-xl hover:shadow-blue-500/5 cursor-pointer relative overflow-hidden"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-start gap-5">
                      <div className="w-16 h-16 rounded-[1.25rem] bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-inner group-hover:scale-110 transition-transform duration-500">
                        <Users className="w-8 h-8 stroke-[1.5px]" />
                      </div>
                      <div className="space-y-1 mt-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight leading-none group-hover:text-blue-600 transition-colors">{client.name}</h3>
                          <Badge className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2.5 h-6 rounded-lg",
                            client.status === 'ACTIVO' 
                              ? "bg-green-100 text-green-700 hover:bg-green-100" 
                              : "bg-gray-100 text-gray-600 hover:bg-gray-100"
                          )}>
                            {client.status}
                          </Badge>
                        </div>
                        <div className="flex flex-col gap-1.5 mt-3">
                          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 dark:text-gray-400">
                            <Phone className="w-4 h-4 text-indigo-400" />
                            {client.phone || 'Sin teléfono'}
                          </div>
                          <div className="flex items-center gap-2 text-sm font-medium text-gray-400 dark:text-gray-500 italic">
                            <Mail className="w-4 h-4 text-gray-300" />
                            {client.email || 'Sin correo electrónico'}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-6 pt-4 md:pt-0 border-t md:border-t-0 border-gray-50 dark:border-gray-800">
                      <div className="text-left md:text-right space-y-1">
                        <p className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Saldo Pendiente</p>
                        <p className="text-2xl font-black text-blue-600 dark:text-blue-400 leading-none">
                          ${client.totalAmount.toLocaleString()}
                        </p>
                        <p className="text-xs font-bold text-gray-400">
                          {client.totalLoans} préstamos activos
                        </p>
                      </div>
                      <Link href={`/${userRole?.toLowerCase() || 'admin'}/clients/${client.id}`} className="md:ml-4">
                        <Button 
                          variant="secondary" 
                          className="h-14 px-6 rounded-2xl font-black uppercase tracking-widest text-xs bg-gray-50 dark:bg-gray-800 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          Ver Perfil
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

