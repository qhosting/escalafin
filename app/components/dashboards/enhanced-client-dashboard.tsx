
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleWrapper } from '@/components/ui/module-wrapper';
import { useModules } from '@/hooks/use-modules';
import { 
  Building2, 
  CreditCard, 
  Calendar, 
  DollarSign, 
  AlertCircle, 
  CheckCircle, 
  LogOut, 
  ArrowRight,
  Bell,
  Calculator,
  Globe,
  FileText,
  User,
  FolderOpen,
  FilePlus,
  Receipt,
  TrendingUp
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export function EnhancedClientDashboard() {
  const { data: session, status } = useSession() || {};
  const { modules, loading: modulesLoading } = useModules();

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
    toast.success('Sesión cerrada');
  };

  // Mock data for client loans and payments
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
    }
  ];

  // Módulos de Préstamos y Solicitudes
  const loanModules = [
    {
      title: 'Mis Préstamos',
      description: 'Ver préstamos activos',
      icon: CreditCard,
      route: '/cliente/loans',
      moduleKey: 'my_loans',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Solicitar Crédito',
      description: 'Nueva solicitud',
      icon: FilePlus,
      route: '/cliente/credit-applications/new',
      moduleKey: 'credit_application_create',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Mis Solicitudes',
      description: 'Ver estado de solicitudes',
      icon: FileText,
      route: '/cliente/credit-applications',
      moduleKey: 'credit_application_list',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  // Módulos de Pagos
  const paymentModules = [
    {
      title: 'Pagar en Línea',
      description: 'Pago con tarjeta',
      icon: Globe,
      route: '/cliente/pay-online',
      moduleKey: 'payment_online',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Historial de Pagos',
      description: 'Ver todos mis pagos',
      icon: Receipt,
      route: '/cliente/payments',
      moduleKey: 'payment_history',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Próximos Pagos',
      description: 'Calendario de pagos',
      icon: Calendar,
      route: '/cliente/payments/schedule',
      moduleKey: 'payment_schedule',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    }
  ];

  // Módulos de Información Personal
  const profileModules = [
    {
      title: 'Mi Perfil',
      description: 'Actualizar información',
      icon: User,
      route: '/cliente/profile',
      moduleKey: 'client_profile',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Mis Documentos',
      description: 'Archivos en Google Drive',
      icon: FolderOpen,
      route: '/cliente/files',
      moduleKey: 'file_manager',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Calculadora',
      description: 'Simular préstamos',
      icon: Calculator,
      route: '/cliente/calculator',
      moduleKey: 'loan_calculator',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    }
  ];

  if (status === 'loading' || modulesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EscalaFin</h1>
              <p className="text-sm text-gray-500">Portal del Cliente</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ModuleWrapper moduleKey="notifications_inapp">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </Button>
            </ModuleWrapper>
            <Badge variant="secondary">Cliente</Badge>
            <span className="text-sm text-gray-600">
              {session?.user?.name}
            </span>
            <Button onClick={handleSignOut} variant="outline" size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            ¡Bienvenido, {session?.user?.name?.split(' ')[0] || 'Cliente'}!
          </h2>
          <p className="text-green-100">
            Gestiona tus préstamos y pagos de manera fácil y segura.
          </p>
        </div>

        {/* PRÉSTAMOS Y SOLICITUDES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="h-5 w-5 mr-2 text-blue-600" />
              Préstamos y Solicitudes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {loanModules.map((module, index) => (
                <ModuleWrapper key={index} moduleKey={module.moduleKey}>
                  <Link href={module.route}>
                    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`${module.bgColor} p-2 rounded-lg`}>
                            <module.icon className={`h-5 w-5 ${module.color}`} />
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {module.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {module.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </ModuleWrapper>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* PAGOS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <DollarSign className="h-5 w-5 mr-2 text-emerald-600" />
              Pagos y Calendario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paymentModules.map((module, index) => (
                <ModuleWrapper key={index} moduleKey={module.moduleKey}>
                  <Link href={module.route}>
                    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`${module.bgColor} p-2 rounded-lg`}>
                            <module.icon className={`h-5 w-5 ${module.color}`} />
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {module.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {module.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </ModuleWrapper>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* MI INFORMACIÓN */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <User className="h-5 w-5 mr-2 text-indigo-600" />
              Mi Información y Herramientas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {profileModules.map((module, index) => (
                <ModuleWrapper key={index} moduleKey={module.moduleKey}>
                  <Link href={module.route}>
                    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`${module.bgColor} p-2 rounded-lg`}>
                            <module.icon className={`h-5 w-5 ${module.color}`} />
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {module.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {module.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </ModuleWrapper>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Active Loans */}
        <ModuleWrapper moduleKey="my_loans">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Mis Préstamos Activos
                </CardTitle>
                <Badge>{activeLoans.length} activo{activeLoans.length !== 1 ? 's' : ''}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activeLoans.map((loan) => (
                  <div key={loan.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900">{loan.type}</h3>
                        <p className="text-sm text-gray-600">Contrato: {loan.id}</p>
                      </div>
                      <Badge className="bg-green-100 text-green-800">
                        Activo
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-gray-600">Monto Original</p>
                        <p className="font-semibold">
                          ${loan.originalAmount.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Saldo Restante</p>
                        <p className="font-semibold text-blue-600">
                          ${loan.remainingBalance.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Pago Mensual</p>
                        <p className="font-semibold">
                          ${loan.monthlyPayment.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Próximo Pago</p>
                        <p className="font-semibold text-orange-600">
                          {new Date(loan.nextPaymentDate).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <div className="w-full bg-gray-200 rounded-full h-2 mr-4">
                        <div 
                          className="bg-blue-600 h-2 rounded-full" 
                          style={{
                            width: `${((loan.originalAmount - loan.remainingBalance) / loan.originalAmount) * 100}%`
                          }}
                        ></div>
                      </div>
                      <span className="text-sm text-gray-600 whitespace-nowrap">
                        {Math.round(((loan.originalAmount - loan.remainingBalance) / loan.originalAmount) * 100)}% pagado
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </ModuleWrapper>

        {/* Recent Payments */}
        <ModuleWrapper moduleKey="payment_history">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="h-5 w-5 mr-2" />
                Historial de Pagos Reciente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentPayments.map((payment, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="bg-green-100 p-2 rounded-full">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-medium">
                          ${payment.amount.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(payment.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className="text-green-600">
                        Completado
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {payment.reference}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </ModuleWrapper>

        {/* Payment Reminder */}
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-orange-800">
                  Próximo Pago: 1 de Octubre
                </p>
                <p className="text-sm text-orange-700">
                  Monto: $9,025 - No olvides realizar tu pago a tiempo
                </p>
              </div>
              <ModuleWrapper moduleKey="payment_online">
                <Link href="/pay-online">
                  <Button size="sm" className="ml-auto">
                    Pagar Ahora
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </ModuleWrapper>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
