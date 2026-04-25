
'use client';

import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ModuleWrapper } from '@/components/ui/module-wrapper';
import { useModules } from '@/hooks/use-modules';
import { QuickModuleToggle } from '@/components/admin/quick-module-toggle';
import { SubscriptionBanner } from '@/components/admin/subscription-banner';
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
  Database,
  Loader2,
  Layers,
  ShieldCheck,
  Phone
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { CierrePenalizaciones } from '@/components/admin/operations/cierre-penalizaciones';
import { PageLoader } from '@/components/ui/page-loader';
import { CarteraDashboard } from '@/components/dashboards/cartera-dashboard';

interface DashboardStats {
  activeLoans: number;
  totalClients: number;
  paymentsThisMonth: number;
  totalPortfolio: number;
  pendingApplications: number;
  loanGrowth: number;
  recentActivities?: {
    action: string;
    details: string;
    time: string;
    status: string;
    moduleKey: string;
  }[];
}

export function EnhancedAdminDashboard() {
  const { data: session, status } = useSession() || {};
  const { modules, loading: modulesLoading } = useModules();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Cargar estadísticas reales desde la API
  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/admin-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          console.error('Error al cargar estadísticas');
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoadingStats(false);
      }
    }

    if (session?.user?.role === 'ADMIN') {
      fetchStats();
    }
  }, [session]);

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

  // Tarjetas de estadísticas con datos reales
  const statsCards = [
    {
      title: 'Préstamos Activos',
      value: loadingStats ? '...' : stats?.activeLoans.toString() || '0',
      change: loadingStats ? '...' : (stats?.loanGrowth ? `${stats.loanGrowth > 0 ? '+' : ''}${stats.loanGrowth}%` : '0%'),
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      moduleKey: 'loan_list'
    },
    {
      title: 'Clientes Registrados',
      value: loadingStats ? '...' : stats?.totalClients.toString() || '0',
      change: '+0%',
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      moduleKey: 'client_list'
    },
    {
      title: 'Pagos Este Mes',
      value: loadingStats ? '...' : `$${(stats?.paymentsThisMonth || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: '+0%',
      icon: DollarSign,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      moduleKey: 'payment_history'
    },
    {
      title: 'Cartera Total',
      value: loadingStats ? '...' : `$${(stats?.totalPortfolio || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      change: '+0%',
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
      description: 'Cobros en efectivo y SPEI',
      icon: Wallet,
      route: '/admin/payments',
      moduleKey: 'payment_history',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Módulo No Pago',
      description: 'Reportar incidencias y ausencias',
      icon: Activity,
      route: '/admin/payments/no-pago',
      moduleKey: 'loan_list',
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Gestión de Comisiones',
      description: 'Control de pagos a asesores',
      icon: Layers,
      route: '/admin/commissions',
      moduleKey: 'payment_history',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
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
      title: 'Scoring & IA',
      description: 'Evaluación y modelos IA',
      icon: Calculator,
      route: '/admin/scoring',
      moduleKey: 'credit_scoring',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50'
    },
    {
      title: 'Reportes Personalizados',
      description: 'Generar reportes en Excel',
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
      title: 'Centro de Mensajería',
      description: 'Chat en vivo y Chatbot',
      icon: MessageSquare,
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
      title: 'Verificación KYC',
      description: 'Validar documentos INE',
      icon: ShieldCheck,
      route: '/admin/kyc',
      moduleKey: 'user_management',
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50'
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
    },
    {
      title: 'Rutas de Cobranza',
      description: 'Seguimiento de visitas',
      icon: Phone,
      route: '/admin/collections',
      moduleKey: 'report_collections',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  const recentActivities = stats?.recentActivities || [];

  // Removemos el PageLoader de pantalla completa para evitar el "doble loading"
  // Los ModuleWrapper individuales manejarán sus estados de carga localmente
  // y AuthWrapper ya maneja el estado de la sesión.

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="space-y-6">
        <SubscriptionBanner />
        {/* Executive Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between pb-2 border-b border-gray-200 dark:border-gray-800 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Resumen de Operaciones
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Indicadores clave de rendimiento (KPIs) y estado del negocio.
            </p>
          </div>
          <div className="text-left sm:text-right mt-2 sm:mt-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white capitalize">
              {new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        {/* Acciones del Día (Multas) */}
        {session?.user?.role === 'ADMIN' && (
          <div className="flex flex-col sm:flex-row items-center gap-4 bg-orange-50/50 dark:bg-orange-950/10 p-6 rounded-[2rem] border border-orange-100 dark:border-orange-900/50">
            <div className="flex-1 space-y-1">
              <h3 className="text-lg font-black text-orange-900 dark:text-orange-400 uppercase italic leading-none">Operaciones del Día</h3>
              <p className="text-xs font-bold text-orange-700/60 tracking-tight">Ejecución masiva de cargos y cierres operativos del sistema.</p>
            </div>
            <div className="flex items-center gap-3">
               <CierrePenalizaciones />
            </div>
          </div>
        )}

        {/* Stats Cards - Datos Reales */}
        <ModuleWrapper moduleKey="dashboard_overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingStats ? (
              <>
                {[1, 2, 3, 4].map((i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <div className="h-4 w-24 bg-gray-200 rounded" />
                          <div className="h-8 w-32 bg-gray-300 rounded" />
                          <div className="h-4 w-16 bg-gray-100 rounded" />
                        </div>
                        <div className="h-12 w-12 bg-gray-200 rounded-full" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </>
            ) : (
              statsCards.map((stat, index) => (
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
              ))
            )}
          </div>
        </ModuleWrapper>

        {/* ── Dashboard de Cartera ────────────────────────── */}
        <CarteraDashboard />

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
              Comunicaciones WhatsApp (WAHA)
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
                        <div className={`p-2 rounded-full ${activity.status === 'success' ? 'bg-green-100' :
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
                      <Badge variant="outline">
                        {activity.time ? formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: es }) : ''}
                      </Badge>
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
