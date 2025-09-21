
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PWAInstallPrompt } from '@/components/pwa/pwa-install-prompt';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CreditCard, 
  DollarSign, 
  Calendar, 
  FileText, 
  Phone, 
  MessageCircle,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Loan {
  id: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  status: string;
  startDate: string;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  totalPaid: number;
  remainingBalance: number;
}

interface Payment {
  id: string;
  amount: number;
  date: string;
  status: string;
  method: string;
}

export default function ClientPWAPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [recentPayments, setRecentPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login?callbackUrl=/pwa/client');
    } else if (session?.user && session.user.role !== 'CLIENTE') {
      router.push('/');
    }
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user) {
      loadClientData();
    }
  }, [session]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      
      // Load loans
      const loansResponse = await fetch('/api/loans');
      if (loansResponse.ok) {
        const loansData = await loansResponse.json();
        setLoans(loansData.loans || []);
      }

      // Load recent payments
      const paymentsResponse = await fetch('/api/payments/transactions');
      if (paymentsResponse.ok) {
        const paymentsData = await paymentsResponse.json();
        setRecentPayments(paymentsData.transactions?.slice(0, 5) || []);
      }
    } catch (error) {
      console.error('Error loading client data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadClientData();
    setRefreshing(false);
  };

  const makePayment = async (loanId: string) => {
    try {
      // Redirect to payment flow
      router.push(`/cliente/loans/${loanId}?action=pay`);
    } catch (error) {
      console.error('Error initiating payment:', error);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  const activeLoan = loans.find(loan => loan.status === 'ACTIVE');
  const totalDebt = loans.reduce((sum, loan) => sum + loan.remainingBalance, 0);
  const totalPaid = loans.reduce((sum, loan) => sum + loan.totalPaid, 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <PWAInstallPrompt appName="Cliente EscalaFin" />
      <OfflineIndicator />

      {/* Header */}
      <div className="bg-blue-600 text-white p-4 sticky top-0 z-40">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold">Mi Portal</h1>
            <p className="text-blue-100 text-sm">
              Bienvenido, {session?.user?.name}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-white hover:bg-blue-700"
          >
            <TrendingUp className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Deuda Total</p>
                  <p className="text-xl font-bold text-red-600">
                    ${totalDebt.toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-6 w-6 text-red-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pagado</p>
                  <p className="text-xl font-bold text-green-600">
                    ${totalPaid.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-6 w-6 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Next Payment Alert */}
        {activeLoan && (
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-orange-800">
                    Próximo Pago
                  </p>
                  <p className="text-sm text-orange-700">
                    ${activeLoan.nextPaymentAmount.toLocaleString()} • {' '}
                    {format(new Date(activeLoan.nextPaymentDate), 'dd MMM yyyy', { locale: es })}
                  </p>
                  <Button
                    size="sm"
                    className="mt-2 bg-orange-600 hover:bg-orange-700"
                    onClick={() => makePayment(activeLoan.id)}
                  >
                    Pagar Ahora
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Main Content Tabs */}
        <Tabs defaultValue="loans" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="loans">Préstamos</TabsTrigger>
            <TabsTrigger value="payments">Pagos</TabsTrigger>
            <TabsTrigger value="contact">Contacto</TabsTrigger>
          </TabsList>

          <TabsContent value="loans" className="space-y-4 mt-4">
            {loans.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No tienes préstamos activos</p>
                </CardContent>
              </Card>
            ) : (
              loans.map((loan) => (
                <Card key={loan.id}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">
                        Préstamo #{loan.id.slice(-6)}
                      </CardTitle>
                      <Badge variant={loan.status === 'ACTIVE' ? 'default' : 'secondary'}>
                        {loan.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-600">Monto Original</p>
                        <p className="font-semibold">${loan.amount.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Saldo Restante</p>
                        <p className="font-semibold text-red-600">
                          ${loan.remainingBalance.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-600">Tasa de Interés</p>
                        <p className="font-semibold">{loan.interestRate}%</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Plazo</p>
                        <p className="font-semibold">{loan.termMonths} meses</p>
                      </div>
                    </div>

                    {loan.status === 'ACTIVE' && (
                      <div className="mt-4 pt-4 border-t space-y-2">
                        <Button
                          className="w-full"
                          onClick={() => makePayment(loan.id)}
                        >
                          <CreditCard className="h-4 w-4 mr-2" />
                          Hacer Pago
                        </Button>
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => router.push(`/cliente/loans/${loan.id}`)}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Ver Detalles
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-4 mt-4">
            {recentPayments.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay pagos recientes</p>
                </CardContent>
              </Card>
            ) : (
              recentPayments.map((payment) => (
                <Card key={payment.id}>
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">${payment.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">
                          {format(new Date(payment.date), 'dd MMM yyyy', { locale: es })} • {payment.method}
                        </p>
                      </div>
                      <Badge variant={payment.status === 'completed' ? 'default' : 'destructive'}>
                        {payment.status === 'completed' ? 'Completado' : 'Pendiente'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="contact" className="space-y-4 mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Contacta a tu Asesor</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button className="w-full" variant="outline">
                  <Phone className="h-4 w-4 mr-2" />
                  Llamar Ahora
                </Button>
                <Button className="w-full" variant="outline">
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Enviar WhatsApp
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atención al Cliente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p><strong>Teléfono:</strong> (55) 1234-5678</p>
                <p><strong>Email:</strong> soporte@escalafin.com</p>
                <p><strong>Horario:</strong> Lun-Vie 9:00-18:00</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
