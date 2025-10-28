
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleWrapper } from '@/components/ui/module-wrapper';
import { useModules } from '@/hooks/use-modules';
import { QuickModuleToggle } from '@/components/admin/quick-module-toggle';
import { 
  Building2, 
  Users, 
  CreditCard, 
  DollarSign, 
  TrendingUp, 
  FileText, 
  LogOut, 
  BarChart3,
  Calculator,
  Shield,
  CreditCard as PaymentIcon,
  ArrowRight,
  Activity,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Settings,
  Bell,
  UserPlus,
  Plus,
  Globe,
  Download,
  MessageCircle,
  Wrench,
  FolderOpen,
  Wallet,
  UserCheck,
  FilePlus,
  TrendingDown,
  Smartphone,
  Database
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export function EnhancedAdminDashboard() {
  const { data: session, status } = useSession() || {};
  const { modules, loading: modulesLoading } = useModules();

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
    toast.success('Sesión cerrada');
  };

  // Get enabled modules grouped by category
  const modulesByCategory = modules.reduce((acc, module) => {
    if (!acc[module.category]) {
      acc[module.category] = [];
    }
    acc[module.category].push(module);
    return acc;
  }, {} as Record<string, any[]>);

  const stats = [
    {
      title: 'Préstamos Activos',
      value: '3',
      change: '+12%',
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      moduleKey: 'loan_list'
    },
    {
      title: 'Clientes Registrados',
      value: '8',
      change: '+25%',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      moduleKey: 'client_list'
    },
    {
      title: 'Pagos Este Mes',
      value: '$45,250',
      change: '+8%',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      moduleKey: 'payment_history'
    },
    {
      title: 'Cartera Total',
      value: '$250,000',
      change: '+15%',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      moduleKey: 'report_portfolio'
    }
  ];

  // Módulos principales organizados por categorías
  const coreModules = [
    {
      title: 'Gestión de Clientes',
      description: 'CRUD completo de clientes',
      icon: Users,
      route: '/admin/clients',
      moduleKey: 'client_list',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Solicitudes de Crédito',
      description: 'Workflow de aprobación',
      icon: FilePlus,
      route: '/admin/credit-applications',
      moduleKey: 'credit_application_list',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Gestión de Préstamos',
      description: 'Ver y administrar préstamos',
      icon: CreditCard,
      route: '/admin/loans',
      moduleKey: 'loan_list',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Gestión de Pagos',
      description: 'Pagos Openpay y efectivo',
      icon: Wallet,
      route: '/admin/payments',
      moduleKey: 'payment_history',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    }
  ];

  const analyticsModules = [
    {
      title: 'Analytics Avanzado',
      description: 'KPIs y métricas financieras',
      icon: BarChart3,
      route: '/admin/analytics',
      moduleKey: 'admin_analytics',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Scoring Crediticio',
      description: 'Evaluación de riesgo',
      icon: Calculator,
      route: '/admin/scoring',
      moduleKey: 'credit_scoring',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Reportes',
      description: 'Generar reportes detallados',
      icon: FileText,
      route: '/admin/reports',
      moduleKey: 'report_portfolio',
      color: 'text-pink-600',
      bgColor: 'bg-pink-50'
    },
    {
      title: 'Auditoría',
      description: 'Logs y trazabilidad',
      icon: Shield,
      route: '/admin/audit',
      moduleKey: 'audit_log',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  const whatsappModules = [
    {
      title: 'Config. EvolutionAPI',
      description: 'Configurar integración',
      icon: Settings,
      route: '/admin/whatsapp',
      moduleKey: 'whatsapp_config',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Config. Clientes',
      description: 'Preferencias por cliente',
      icon: UserCheck,
      route: '/admin/whatsapp/clients',
      moduleKey: 'whatsapp_client_settings',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Dashboard Mensajes',
      description: 'Monitor de envíos',
      icon: MessageCircle,
      route: '/admin/whatsapp/messages',
      moduleKey: 'whatsapp_dashboard',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Recarga Mensajes',
      description: 'Gestionar paquetes',
      icon: Plus,
      route: '/admin/message-recharges',
      moduleKey: 'message_recharges',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const systemModules = [
    {
      title: 'Gestionar Usuarios',
      description: 'Administrar cuentas',
      icon: Users,
      route: '/admin/users',
      moduleKey: 'user_management',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Gestión Archivos',
      description: 'Documentos en Google Drive',
      icon: FolderOpen,
      route: '/admin/files',
      moduleKey: 'file_manager',
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'Gestión Módulos',
      description: 'Configurar módulos PWA',
      icon: Database,
      route: '/admin/modules',
      moduleKey: 'module_management',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Configuración',
      description: 'Ajustes del sistema',
      icon: Settings,
      route: '/admin/settings',
      moduleKey: 'system_settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
    }
  ];

  const mobileModules = [
    {
      title: 'Cobro Móvil',
      description: 'App PWA para cobradores',
      icon: Smartphone,
      route: '/pwa',
      moduleKey: 'cash_collection',
      color: 'text-teal-600',
      bgColor: 'bg-teal-50'
    }
  ];

  const recentActivities = [
    { 
      action: 'Pago procesado', 
      details: '$9,025 - Cliente: María García', 
      time: '2 min', 
      status: 'success',
      moduleKey: 'payment_history'
    },
    { 
      action: 'Nuevo préstamo creado', 
      details: '$50,000 - Cliente: Juan Pérez', 
      time: '15 min', 
      status: 'info',
      moduleKey: 'loan_create'
    },
    { 
      action: 'Cliente registrado', 
      details: 'Ana López - Asesor: Carlos Ruiz', 
      time: '1 hr', 
      status: 'success',
      moduleKey: 'client_add'
    },
    { 
      action: 'Pago vencido', 
      details: '$4,500 - Cliente: Pedro Martín', 
      time: '2 hrs', 
      status: 'warning',
      moduleKey: 'report_collections'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="space-y-6">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            ¡Bienvenido, {session?.user?.name?.split(' ')[0] || 'Administrador'}!
          </h2>
          <p className="text-blue-100">
            Tienes acceso completo a {modules.length} módulos. Panel de administración integral.
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

        {/* MÓDULOS PRINCIPALES (CORE) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <CreditCard className="h-5 w-5 mr-2 text-green-600" />
              Módulos Principales - Gestión de Cartera
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {coreModules.map((module, index) => (
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

        {/* ANALYTICS Y SCORING */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
              Analytics, Reportes y Auditoría
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {analyticsModules.map((module, index) => (
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

        {/* MÓDULOS WHATSAPP */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <MessageSquare className="h-5 w-5 mr-2 text-green-600" />
              Comunicaciones WhatsApp (EvolutionAPI)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {whatsappModules.map((module, index) => (
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

        {/* SISTEMA Y CONFIGURACIÓN */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Settings className="h-5 w-5 mr-2 text-gray-600" />
              Sistema, Archivos y Configuración
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {systemModules.map((module, index) => (
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

        {/* PWA MÓVIL */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-lg">
              <Smartphone className="h-5 w-5 mr-2 text-teal-600" />
              Aplicaciones Móviles (PWA)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mobileModules.map((module, index) => (
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

        {/* Recent Activity & Module Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
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
                            <Activity className="h-4 w-4 text-blue-600" />
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

          <ModuleWrapper moduleKey="system_settings">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Control Rápido de Módulos
                  </CardTitle>
                  <Link href="/admin/modules">
                    <Button variant="outline" size="sm">
                      Ver todos
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <QuickModuleToggle compact={true} showCategories={['TOOLS', 'NOTIFICATIONS', 'INTEGRATIONS']} />
              </CardContent>
            </Card>
          </ModuleWrapper>
        </div>
      </div>
    </div>
  );
}
