
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PWAInstallPrompt } from '@/components/pwa/pwa-install-prompt';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  MapPin, 
  Phone, 
  MessageCircle, 
  DollarSign, 
  Search,
  Navigation,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PWAStorage, STORES } from '@/lib/pwa-storage';
import { useOnlineStatus } from '@/hooks/use-online-status';

interface Client {
  id: string;
  name: string;
  phone: string;
  address: string;
  overdueDays: number;
  overdueAmount: number;
  lastPaymentDate: string;
  status: 'current' | 'overdue' | 'critical';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface CollectionTask {
  id: string;
  clientName: string;
  amount: number;
  dueDate: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'completed' | 'failed';
}

import { GenericSpinner } from '@/components/layout/loading-variants';

export default function AsesorPWAPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [clients, setClients] = useState<Client[]>([]);
  const [tasks, setTasks] = useState<CollectionTask[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState<GeolocationPosition | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/pwa/asesor');
    } else if (session?.user && !['ASESOR', 'ADMIN'].includes(session.user.role)) {
      router.push('/');
    }
  }, [session, status, router]);

  const isOnline = useOnlineStatus();
  const [storage, setStorage] = useState<PWAStorage | null>(null);

  useEffect(() => {
    if (session?.user?.tenantId) {
      setStorage(new PWAStorage(session.user.tenantId));
    }
  }, [session]);

  useEffect(() => {
    if (storage) {
      if (isOnline) {
        loadAsesorData();
      } else {
        loadFromCache();
      }
      getCurrentLocation();
    }
  }, [session, isOnline, storage]);

  const loadFromCache = async () => {
    if (!storage) return;
    try {
      setLoading(true);
      const cachedClients = await storage.getAll(STORES.CLIENTS);
      if (cachedClients.length > 0) {
        setClients(cachedClients);
      }
    } catch (error) {
      console.error('Error loading from cache:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAsesorData = async () => {
    try {
      setLoading(true);
      
      const loansResponse = await fetch('/api/loans');
      if (loansResponse.ok) {
        const loansData = await loansResponse.json();
        const loans = Array.isArray(loansData) ? loansData : loansData.loans || [];
        
        const clientsMap = new Map<string, Client>();
        const tasksArray: CollectionTask[] = [];
        
        loans.forEach((loan: any) => {
          if (!loan.client) return;
          
          const clientId = loan.client.id;
          const clientKey = `${loan.client.firstName} ${loan.client.lastName}`;
          const overduePayments = (loan.payments || []).filter((p: any) => 
            p.status === 'PENDING' || p.status === 'OVERDUE'
          );
          
          const overdueAmount = overduePayments.reduce((sum: number, p: any) => 
            sum + Number(p.amount || 0), 0
          );
          
          let maxOverdueDays = 0;
          overduePayments.forEach((payment: any) => {
            const dueDate = new Date(payment.dueDate);
            const today = new Date();
            const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
            if (daysOverdue > maxOverdueDays) maxOverdueDays = daysOverdue;
          });
          
          const paidPayments = (loan.payments || []).filter((p: any) => p.status === 'PAID');
          const lastPayment = paidPayments.sort((a: any, b: any) => 
            new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
          )[0];
          
          let status: 'current' | 'overdue' | 'critical' = maxOverdueDays === 0 ? 'current' : (maxOverdueDays > 30 ? 'critical' : 'overdue');
          
          if (!clientsMap.has(clientId)) {
            clientsMap.set(clientId, {
              id: clientId,
              name: clientKey,
              phone: loan.client.phone || 'No disponible',
              address: `${loan.client.address || ''}, ${loan.client.city || ''}`.trim() || 'No disponible',
              overdueDays: maxOverdueDays,
              overdueAmount: overdueAmount,
              lastPaymentDate: lastPayment ? lastPayment.paymentDate : new Date().toISOString(),
              status,
              coordinates: loan.client.latitude && loan.client.longitude ? {
                lat: loan.client.latitude,
                lng: loan.client.longitude
              } : {
                lat: 19.4326 + (Math.random() - 0.5) * 0.1,
                lng: -99.1332 + (Math.random() - 0.5) * 0.1
              }
            });
          } else {
            const existing = clientsMap.get(clientId)!;
            existing.overdueAmount += overdueAmount;
            existing.overdueDays = Math.max(existing.overdueDays, maxOverdueDays);
            if (status === 'critical') existing.status = 'critical';
            else if (status === 'overdue' && existing.status === 'current') existing.status = 'overdue';
          }

          // Create collection tasks for overdue payments
          if (overdueAmount > 0) {
            overduePayments.forEach((payment: any) => {
              const dueDate = new Date(payment.dueDate);
              const daysOverdue = Math.floor((new Date().getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
              
              let priority: 'high' | 'medium' | 'low' = daysOverdue > 30 ? 'high' : (daysOverdue > 15 ? 'medium' : 'low');
              
              tasksArray.push({
                id: payment.id,
                clientName: clientKey,
                amount: Number(payment.amount || 0),
                dueDate: payment.dueDate,
                priority,
                status: 'pending'
              });
            });
          }
        });
        
        const finalClients = Array.from(clientsMap.values());
        setClients(finalClients);
        setTasks(tasksArray);
        
        // Cache for offline
        if (storage) {
          for (const client of finalClients) {
            await storage.put(STORES.CLIENTS, client);
          }
        }
      }
    } catch (error) {
      console.error('Error loading asesor data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => setLocation(position),
        (error) => console.error('Error getting location:', error)
      );
    }
  };

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  const callClient = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const sendWhatsApp = (phone: string, message: string = 'Hola, me comunico de EscalaFin para recordarle su pago pendiente.') => {
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=${encodedMessage}`, '_blank');
  };

  const openNavigation = (address: string) => {
    if (location) {
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://maps.google.com/maps?saddr=${location.coords.latitude},${location.coords.longitude}&daddr=${encodedAddress}`, '_blank');
    } else {
      window.open(`https://maps.google.com/maps?q=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const registerPayment = (clientId: string) => {
    router.push(`/mobile/cobranza?clientId=${clientId}`);
  };

  if (status === 'loading' || loading) {
    return <GenericSpinner />;
  }

  const overdueClients = clients.filter(c => c.status === 'overdue' || c.status === 'critical').length;
  const totalOverdue = clients.reduce((sum, c) => sum + (c.status !== 'current' ? c.overdueAmount : 0), 0);
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PWAInstallPrompt appName="Asesor EscalaFin" />
      <OfflineIndicator />

      {/* Header */}
      <div className="bg-green-600 text-white p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Portal Asesor</h1>
            <p className="text-green-100 text-sm">
              {session?.user?.name}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="text-white hover:bg-green-700"
          >
            <TrendingUp className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{overdueClients}</p>
                <p className="text-xs text-gray-600">Clientes Vencidos</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-lg font-bold text-orange-600">
                  ${Math.round(totalOverdue/1000)}K
                </p>
                <p className="text-xs text-gray-600">Cartera Vencida</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{pendingTasks}</p>
                <p className="text-xs text-gray-600">Tareas Pendientes</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="clients" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="clients">Clientes</TabsTrigger>
            <TabsTrigger value="tasks">Tareas</TabsTrigger>
          </TabsList>

          <TabsContent value="clients" className="space-y-3 mt-4">
            {filteredClients.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron clientes</p>
                </CardContent>
              </Card>
            ) : (
              filteredClients.map((client) => (
                <Card key={client.id} className={`
                  ${client.status === 'critical' ? 'border-red-300 bg-red-50' : 
                    client.status === 'overdue' ? 'border-orange-300 bg-orange-50' : ''}
                `}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold">{client.name}</h3>
                        <p className="text-sm text-gray-600">{client.phone}</p>
                        <p className="text-xs text-gray-500 mt-1">{client.address}</p>
                      </div>
                      <Badge 
                        variant={
                          client.status === 'critical' ? 'destructive' : 
                          client.status === 'overdue' ? 'secondary' : 'default'
                        }
                      >
                        {client.status === 'critical' ? 'Crítico' : 
                         client.status === 'overdue' ? 'Vencido' : 'Al día'}
                      </Badge>
                    </div>

                    {client.status !== 'current' && (
                      <div className="mb-3 p-2 bg-white rounded border">
                        <p className="text-sm">
                          <strong>Vencido:</strong> ${client.overdueAmount.toLocaleString()} 
                          ({Math.round(client.overdueDays)} días)
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-4 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => callClient(client.phone)}
                        className="p-2"
                      >
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendWhatsApp(client.phone)}
                        className="p-2"
                      >
                        <MessageCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => openNavigation(client.address)}
                        className="p-2"
                      >
                        <Navigation className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => registerPayment(client.id)}
                        className="p-2"
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="tasks" className="space-y-3 mt-4">
            {tasks.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay tareas pendientes</p>
                </CardContent>
              </Card>
            ) : (
              tasks.map((task) => (
                <Card key={task.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="font-semibold">{task.clientName}</h3>
                        <p className="text-sm text-gray-600">
                          ${task.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          Vence: {format(new Date(task.dueDate), 'dd MMM', { locale: es })}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge 
                          variant={
                            task.priority === 'high' ? 'destructive' :
                            task.priority === 'medium' ? 'secondary' : 'outline'
                          }
                        >
                          {task.priority === 'high' ? 'Alta' :
                           task.priority === 'medium' ? 'Media' : 'Baja'}
                        </Badge>
                        <div className="mt-2">
                          {task.status === 'pending' ? (
                            <Clock className="h-4 w-4 text-orange-500" />
                          ) : task.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
