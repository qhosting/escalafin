
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, CreditCard, Calendar, DollarSign, AlertCircle, CheckCircle, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export function ClienteDashboard() {
  const { data: session, status } = useSession() || {};



  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
    toast.success('Sesión cerrada');
  };

  // Datos simulados de préstamos del cliente
  const activeLoans = [
    {
      id: 'ESF-2024-001',
      type: 'Préstamo Personal',
      originalAmount: 100000,
      remainingBalance: 72200,
      monthlyPayment: 9025,
      nextPaymentDate: '2024-10-01',
      status: 'active'
    }
  ];

  const recentPayments = [
    {
      date: '2024-09-01',
      amount: 9025,
      status: 'completed',
      reference: 'TRX-004-ESF-2024-001'
    },
    {
      date: '2024-08-01',
      amount: 9025,
      status: 'completed',
      reference: 'TRX-003-ESF-2024-001'
    },
    {
      date: '2024-07-01',
      amount: 9025,
      status: 'completed',
      reference: 'TRX-002-ESF-2024-001'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">EscalaFin</h1>
                <p className="text-xs text-gray-500">Portal del Cliente</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500">Cliente</p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Bienvenido, {session?.user?.name?.split(' ')[0]}
          </h2>
          <p className="text-gray-600">
            Consulta el estado de tus préstamos y historial de pagos
          </p>
        </div>

        {/* Loan Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-600" />
                Préstamos Activos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeLoans.map((loan) => (
                <div key={loan.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900">{loan.type}</h3>
                      <p className="text-sm text-gray-600">Préstamo #{loan.id}</p>
                    </div>
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                      Activo
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">Monto Original</p>
                      <p className="font-medium">${loan.originalAmount.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Saldo Restante</p>
                      <p className="font-medium text-blue-600">${loan.remainingBalance.toLocaleString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-xs text-gray-500">Pago Mensual</p>
                      <p className="font-medium">${loan.monthlyPayment.toLocaleString()}</p>
                    </div>
                    <Button size="sm" variant="outline">
                      Ver Tabla de Amortización
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-orange-600" />
                Próximo Pago
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600 mb-2">
                  $9,025
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  Vencimiento: 01 Oct 2024
                </p>
                <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 mb-4">
                  <p className="text-xs text-orange-800">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Faltan 12 días para el vencimiento
                  </p>
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Realizar Pago
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              Historial de Pagos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentPayments.map((payment, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-gray-900">
                        ${payment.amount.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.date).toLocaleDateString('es-ES', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                      Completado
                    </span>
                    <p className="text-xs text-gray-500 mt-1">
                      {payment.reference}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Loan Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              Progreso del Préstamo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">4</div>
                <p className="text-sm text-gray-600">Pagos Realizados</p>
                <p className="text-xs text-gray-500">de 12 pagos totales</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">33%</div>
                <p className="text-sm text-gray-600">Préstamo Pagado</p>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div className="bg-blue-600 h-2 rounded-full" style={{ width: '33%' }}></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">8</div>
                <p className="text-sm text-gray-600">Pagos Restantes</p>
                <p className="text-xs text-gray-500">hasta completar</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
