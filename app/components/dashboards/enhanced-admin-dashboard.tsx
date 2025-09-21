
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
  Wrench
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

  const quickActions = [
    {
      title: 'Gestionar Usuarios',
      description: 'Administrar cuentas de usuario',
      icon: Users,
      route: '/admin/users',
      moduleKey: 'user_management',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Gestionar Módulos',
      description: 'Configurar módulos PWA',
      icon: Settings,
      route: '/admin/modules',
      moduleKey: 'system_settings',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Ver Préstamos',
      description: 'Revisar todos los préstamos',
      icon: CreditCard,
      route: '/loans',
      moduleKey: 'loan_list',
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Generar Reportes',
      description: 'Crear reportes del sistema',
      icon: FileText,
      route: '/reports',
      moduleKey: 'report_portfolio',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Notificaciones WhatsApp',
      description: 'Configurar mensajería',
      icon: MessageSquare,
      route: '/whatsapp',
      moduleKey: 'whatsapp_notifications',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Configuración Sistema',
      description: 'Ajustes generales',
      icon: Settings,
      route: '/admin/settings',
      moduleKey: 'system_settings',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50'
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Building2 className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">EscalaFin</h1>
              <p className="text-sm text-gray-500">Panel de Administración</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <ModuleWrapper moduleKey="notifications_inapp">
              <Button variant="outline" size="sm">
                <Bell className="h-4 w-4 mr-2" />
                Notificaciones
              </Button>
            </ModuleWrapper>
            <Badge variant="secondary">Admin</Badge>
            <span className="text-sm text-gray-600">
              {session?.user?.name}
            </span>
            <Button 
              onClick={handleSignOut} 
              variant="outline" 
              size="sm"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Welcome Message */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <h2 className="text-2xl font-bold mb-2">
            ¡Bienvenido, {session?.user?.name?.split(' ')[0] || 'Administrador'}!
          </h2>
          <p className="text-blue-100">
            Tienes acceso a {modules.length} módulos habilitados. Gestiona tu plataforma desde aquí.
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

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wrench className="h-5 w-5 mr-2" />
              Acciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action, index) => (
                <ModuleWrapper key={index} moduleKey={action.moduleKey}>
                  <Link href={action.route}>
                    <Card className="hover:shadow-md transition-all duration-200 cursor-pointer border-2 border-transparent hover:border-primary/20">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className={`${action.bgColor} p-2 rounded-lg`}>
                            <action.icon className={`h-5 w-5 ${action.color}`} />
                          </div>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {action.description}
                        </p>
                      </CardContent>
                    </Card>
                  </Link>
                </ModuleWrapper>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
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

        {/* Module Analytics and Quick Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ModuleWrapper moduleKey="admin_analytics">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Análisis de Módulos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(modulesByCategory).slice(0, 6).map(([category, categoryModules]) => (
                    <div key={category} className="text-center p-4 border rounded-lg">
                      <p className="text-2xl font-bold text-primary">
                        {categoryModules.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {category.toLowerCase().replace('_', ' ')}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </ModuleWrapper>

          <ModuleWrapper moduleKey="system_settings">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center">
                    <Settings className="h-5 w-5 mr-2" />
                    Control Rápido
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
