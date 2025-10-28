
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleWrapper } from '@/components/ui/module-wrapper';
import { useModules } from '@/hooks/use-modules';
import { 
  Building2, 
  Users, 
  FileText, 
  DollarSign, 
  TrendingUp, 
  Plus, 
  LogOut, 
  CreditCard, 
  ArrowRight,
  Bell,
  Calculator,
  UserPlus,
  Banknote,
  MessageSquare,
  AlertTriangle,
  CheckCircle,
  Clock,
  FolderOpen,
  Smartphone,
  Wallet,
  FilePlus,
  BarChart3
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export function EnhancedAsesorDashboard() {
  const { data: session, status } = useSession() || {};
  const { modules, loading: modulesLoading } = useModules();

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
    toast.success('Sesión cerrada');
  };

  const stats = [
    {
      title: 'Mis Clientes',
      value: '3',
      change: '+1',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      moduleKey: 'client_list'
    },
    {
      title: 'Cartera Asignada',
      value: '$400,000',
      change: '+5%',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      moduleKey: 'report_portfolio'
    },
    {
      title: 'Solicitudes Enviadas',
      value: '2',
      change: '+2',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      moduleKey: 'loan_create'
    },
    {
      title: 'Meta Mensual',
      value: '67%',
      change: '+12%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      moduleKey: 'dashboard_overview'
    }
  ];

  // Módulos Core para Asesor
  const clientModules = [
    {
      title: 'Agregar Cliente',
      description: 'Registrar nuevo cliente',
      icon: UserPlus,
      route: '/asesor/clients/new',
      moduleKey: 'client_add',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Ver Mis Clientes',
      description: 'Gestionar cartera asignada',
      icon: Users,
      route: '/asesor/clients',
      moduleKey: 'client_list',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Archivos Clientes',
      description: 'Documentos en Google Drive',
      icon: FolderOpen,
      route: '/asesor/files',
      moduleKey: 'file_manager',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  const loanModules = [
    {
      title: 'Crear Solicitud',
      description: 'Nueva solicitud de crédito',
      icon: FilePlus,
      route: '/asesor/credit-applications/new',
      moduleKey: 'credit_application_create',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Mis Solicitudes',
      description: 'Ver solicitudes enviadas',
      icon: FileText,
      route: '/asesor/credit-applications',
      moduleKey: 'credit_application_list',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Mis Préstamos',
      description: 'Cartera de préstamos',
      icon: CreditCard,
      route: '/asesor/loans',
      moduleKey: 'loan_list',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  const operationsModules = [
    {
      title: 'Registrar Pago',
      description: 'Pago en efectivo o tarjeta',
      icon: Wallet,
      route: '/asesor/payments',
      moduleKey: 'payment_cash',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Cobro Móvil',
      description: 'App PWA para campo',
      icon: Smartphone,
      route: '/pwa',
      moduleKey: 'cash_collection',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    },
    {
      title: 'Historial Pagos',
      description: 'Ver pagos recibidos',
      icon: DollarSign,
      route: '/asesor/payments/history',
      moduleKey: 'payment_history',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    }
  ];

  const toolsModules = [
    {
      title: 'Calculadora',
      description: 'Calcular cuotas de préstamo',
      icon: Calculator,
      route: '/asesor/calculator',
      moduleKey: 'loan_calculator',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Enviar WhatsApp',
      description: 'Mensajes a clientes',
      icon: MessageSquare,
      route: '/asesor/whatsapp',
      moduleKey: 'whatsapp_send',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Mis Reportes',
      description: 'Informes de mi cartera',
      icon: BarChart3,
      route: '/asesor/reports',
      moduleKey: 'report_portfolio',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    }
  ];

  const myClients = [
    {
      id: 1,
      name: 'María García',
      phone: '+52 555 0101',
      activeLoans: 1,
      totalAmount: 100000,
      status: 'active',
      nextPayment: '2024-10-01'
    },
    {
      id: 2,
      name: 'Juan Pérez',
      phone: '+52 555 0202',
      activeLoans: 1,
      totalAmount: 50000,
      status: 'active',
      nextPayment: '2024-10-05'
    },
    {
      id: 3,
      name: 'Ana López',
      phone: '+52 555 0303',
      activeLoans: 0,
      totalAmount: 0,
      status: 'pending',
      nextPayment: null
    }
  ];

  const recentActivities = [
    {
      action: 'Pago recibido',
      details: '$9,025 - María García',
      time: '30 min',
      status: 'success',
      moduleKey: 'payment_history'
    },
    {
      action: 'Solicitud enviada',
      details: 'Préstamo $75,000 - Ana López',
      time: '2 hrs',
      status: 'info',
      moduleKey: 'loan_create'
    },
    {
      action: 'Cliente agregado',
      details: 'Carlos Mendoza - Nuevo registro',
      time: '1 día',
      status: 'success',
      moduleKey: 'client_add'
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EscalaFin</h1>
              <p className="text-sm text-gray-500">Panel del Asesor</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ModuleWrapper moduleKey="notifications_inapp">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </Button>
            </ModuleWrapper>
            <Badge variant="secondary">Asesor</Badge>
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
        <div className="bg-gradient-to-r from-purple-600 to-green-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            ¡Bienvenido, {session?.user?.name?.split(' ')[0] || 'Asesor'}!
          </h2>
          <p className="text-purple-100">
            Gestiona tu cartera de clientes y préstamos de manera eficiente.
          </p>
        </div>

        {/* Stats Cards */}
        <ModuleWrapper moduleKey="dashboard_overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <ModuleWrapper key={index} moduleKey={stat.moduleKey}>
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        <p className={`text-sm ${stat.color}`}>{stat.change}</p>
                      </div>
                      <div className={`${stat.bgColor} p-3 rounded-full`}>
                        <stat.icon className={`h-6 w-6 ${stat.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </ModuleWrapper>
            ))}
          </div>
        </ModuleWrapper>

        {/* GESTIÓN DE CLIENTES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Gestión de Clientes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clientModules.map((module, index) => (
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

        {/* GESTIÓN DE PRÉSTAMOS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="h-5 w-5 mr-2 text-green-600" />
              Solicitudes y Préstamos
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

        {/* OPERACIONES Y PAGOS */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Wallet className="h-5 w-5 mr-2 text-emerald-600" />
              Pagos y Cobros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {operationsModules.map((module, index) => (
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

        {/* HERRAMIENTAS Y REPORTES */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Calculator className="h-5 w-5 mr-2 text-indigo-600" />
              Herramientas y Reportes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {toolsModules.map((module, index) => (
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

        {/* My Clients */}
        <ModuleWrapper moduleKey="client_list">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center">
                  <Users className="h-5 w-5 mr-2" />
                  Mis Clientes
                </CardTitle>
                <Link href="/clients">
                  <Button variant="outline" size="sm">
                    Ver todos
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {myClients.map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className="bg-blue-100 p-2 rounded-full">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900">{client.name}</h4>
                        <p className="text-sm text-gray-600">{client.phone}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={client.status === 'active' ? 'default' : 'secondary'}>
                          {client.activeLoans} préstamo{client.activeLoans !== 1 ? 's' : ''}
                        </Badge>
                        <span className="text-sm font-medium">
                          ${client.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      {client.nextPayment && (
                        <p className="text-xs text-gray-500">
                          Próximo pago: {new Date(client.nextPayment).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </ModuleWrapper>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="h-5 w-5 mr-2" />
              Actividad Reciente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivities.map((activity, index) => (
                <ModuleWrapper key={index} moduleKey={activity.moduleKey}>
                  <div className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-full ${
                        activity.status === 'success' ? 'bg-green-100' :
                        activity.status === 'warning' ? 'bg-yellow-100' : 'bg-blue-100'
                      }`}>
                        {activity.status === 'success' ? (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        ) : activity.status === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                        ) : (
                          <Clock className="h-4 w-4 text-blue-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{activity.action}</p>
                        <p className="text-sm text-gray-600">{activity.details}</p>
                      </div>
                    </div>
                    <Badge variant="outline">{activity.time}</Badge>
                  </div>
                </ModuleWrapper>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
