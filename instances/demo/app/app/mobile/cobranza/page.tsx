
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Smartphone, 
  Search, 
  MapPin, 
  DollarSign, 
  User, 
  Calendar,
  CheckCircle2,
  AlertCircle,
  Navigation,
  Banknote,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import CashPaymentForm from '@/components/payments/cash-payment-form';

interface Loan {
  id: string;
  loanNumber: string;
  balanceRemaining: number;
  monthlyPayment: number;
  nextDueDate: string;
  status: string;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    address?: string;
    email?: string;
  };
}

interface CashCollection {
  id: string;
  amount: number;
  paymentDate: string;
  reference: string;
  loan: {
    loanNumber: string;
    client: {
      firstName: string;
      lastName: string;
    };
  };
}

export default function CobranzaMovilPage() {
  const { data: session } = useSession() || {};
  const [searchTerm, setSearchTerm] = useState('');
  const [loans, setLoans] = useState<Loan[]>([]);
  const [collections, setCollections] = useState<CashCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [todayStats, setTodayStats] = useState({
    totalCollections: 0,
    totalAmount: 0,
    loansVisited: 0
  });

  useEffect(() => {
    fetchTodayCollections();
  }, []);

  const fetchTodayCollections = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/payments/cash?collectorId=${session?.user?.id}&dateFrom=${today}&dateTo=${today}`);
      if (response.ok) {
        const data = await response.json();
        setCollections(data.payments || []);
        setTodayStats({
          totalCollections: data.stats.totalPayments,
          totalAmount: data.stats.totalAmount,
          loansVisited: data.stats.totalPayments
        });
      }
    } catch (error) {
      console.error('Error fetching collections:', error);
    }
  };

  const searchLoans = async () => {
    if (!searchTerm.trim()) {
      toast.error('Ingresa un término de búsqueda');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/loans/search?q=${encodeURIComponent(searchTerm)}&includeClient=true`);
      if (!response.ok) throw new Error('Error en la búsqueda');

      const data = await response.json();
      setLoans(data.loans || []);
      
      if (data.loans?.length === 0) {
        toast.info('No se encontraron préstamos que coincidan');
      }
    } catch (error) {
      console.error('Error searching loans:', error);
      toast.error('Error al buscar préstamos');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (payment: any) => {
    toast.success('¡Pago registrado exitosamente!');
    setSelectedLoan(null);
    fetchTodayCollections();
    
    // Update loan balance in the list
    setLoans(prev => prev.map(loan => 
      loan.id === payment.loan.id 
        ? { ...loan, balanceRemaining: payment.loan.newBalance }
        : loan
    ));
  };

  const openMaps = (address: string) => {
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://maps.google.com/?q=${encodedAddress}`, '_blank');
    } else {
      toast.error('Dirección no disponible');
    }
  };

  const callClient = (phone: string) => {
    if (phone) {
      window.open(`tel:${phone}`);
    } else {
      toast.error('Teléfono no disponible');
    }
  };

  if (selectedLoan) {
    return (
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedLoan(null)}
            className="mb-4"
          >
            ← Volver a la lista
          </Button>
        </div>
        <CashPaymentForm 
          loan={selectedLoan}
          onSuccess={handlePaymentSuccess}
          onCancel={() => setSelectedLoan(null)}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
          <Smartphone className="h-8 w-8 text-blue-600" />
          Cobranza Móvil
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Gestión de cobros en campo y registro de pagos en efectivo
        </p>
      </div>

      {/* Today's Stats */}
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cobros Hoy</p>
                <p className="text-2xl font-bold">{todayStats.totalCollections}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Cobrado</p>
                <p className="text-xl font-bold text-green-600">
                  {new Intl.NumberFormat('es-MX', {
                    style: 'currency',
                    currency: 'MXN',
                    notation: 'compact'
                  }).format(todayStats.totalAmount)}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cobrador</p>
                <p className="text-lg font-semibold">{session?.user?.name}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="search" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search">Buscar Préstamos</TabsTrigger>
          <TabsTrigger value="collections">Cobros del Día</TabsTrigger>
        </TabsList>

        <TabsContent value="search">
          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Buscar Préstamo para Cobro</CardTitle>
              <CardDescription>
                Busca por número de préstamo, nombre del cliente o teléfono
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  placeholder="Número de préstamo, nombre o teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && searchLoans()}
                />
                <Button onClick={searchLoans} disabled={loading}>
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  Buscar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {loans.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Resultados de Búsqueda</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {loans.map((loan) => (
                    <div key={loan.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h3 className="font-semibold text-lg">
                            {loan.client.firstName} {loan.client.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground font-mono">
                            {loan.loanNumber}
                          </p>
                          <Badge variant={loan.status === 'ACTIVE' ? 'default' : 'secondary'}>
                            {loan.status}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Saldo Pendiente</p>
                          <p className="text-lg font-bold text-red-600">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN'
                            }).format(loan.balanceRemaining)}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                        <div>
                          <Label>Pago Mensual:</Label>
                          <p className="font-semibold">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN'
                            }).format(loan.monthlyPayment)}
                          </p>
                        </div>
                        <div>
                          <Label>Próximo Vencimiento:</Label>
                          <p className="font-semibold">
                            {new Date(loan.nextDueDate).toLocaleDateString('es-MX')}
                          </p>
                        </div>
                      </div>

                      {loan.client.address && (
                        <div className="mb-4">
                          <Label>Dirección:</Label>
                          <p className="text-sm">{loan.client.address}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => setSelectedLoan(loan)}
                          className="flex-1 flex items-center gap-2"
                        >
                          <Banknote className="h-4 w-4" />
                          Cobrar Efectivo
                        </Button>
                        
                        {loan.client.address && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => openMaps(loan.client.address!)}
                          >
                            <Navigation className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {loan.client.phone && (
                          <Button 
                            variant="outline" 
                            size="icon"
                            onClick={() => callClient(loan.client.phone!)}
                          >
                            📞
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="collections">
          <Card>
            <CardHeader>
              <CardTitle>Cobros Realizados Hoy</CardTitle>
              <CardDescription>
                {new Date().toLocaleDateString('es-MX', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {collections.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    No has realizado cobros hoy
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {collections.map((collection) => (
                    <div key={collection.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold">
                            {collection.loan.client.firstName} {collection.loan.client.lastName}
                          </h3>
                          <p className="text-sm text-muted-foreground font-mono">
                            {collection.loan.loanNumber}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {collection.reference}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-green-600">
                            {new Intl.NumberFormat('es-MX', {
                              style: 'currency',
                              currency: 'MXN'
                            }).format(collection.amount)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(collection.paymentDate).toLocaleTimeString('es-MX')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
