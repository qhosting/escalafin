
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
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
  Folder,
  Box,
  Layers,
  Cloud,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export function AdminDashboard() {
  const { data: session, status } = useSession() || {};



  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/login' });
    toast.success('Sesión cerrada');
  };

  const stats = [
    {
      title: 'Préstamos Activos',
      value: '3',
      change: '+12%',
      icon: CreditCard,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Cartera Total',
      value: '$522,200',
      change: '+8%',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Clientes Activos',
      value: '5',
      change: '+3',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Solicitudes Pendientes',
      value: '2',
      change: '0',
      icon: FileText,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
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
                <p className="text-xs text-gray-500">Panel Administrativo</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500">Administrador</p>
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
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Bienvenido, {session?.user?.name?.split(' ')[0]}
              </h2>
              <p className="text-gray-600">
                Supervisa las operaciones diarias y gestiona la cartera de préstamos
              </p>
            </div>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              <Activity className="h-3 w-3 mr-1" />
              Fase 3 - Funcionalidades Avanzadas
            </Badge>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="relative overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        <TrendingUp className="w-3 h-3 text-green-500" />
                        <span className="text-xs text-green-600 font-medium">
                          {stat.change}
                        </span>
                        <span className="text-xs text-gray-500">vs mes anterior</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Gestión de Préstamos - Core Business */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Préstamos</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/admin/credit-applications">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <FileText className="h-6 w-6 text-orange-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Solicitudes de Crédito</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Revisar y aprobar solicitudes de préstamo
                  </p>
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700">
                    Workflow
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/loans">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Gestionar Préstamos</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Ver, crear y administrar todos los préstamos
                  </p>
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    Core
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/loans/new">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <DollarSign className="h-6 w-6 text-blue-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Nuevo Préstamo</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Crear un nuevo préstamo con tabla de amortización
                  </p>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    Acción rápida
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/clients">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Gestión de Clientes</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    CRM completo para gestión de clientes
                  </p>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                    CRM
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Funcionalidades Avanzadas - Fase 3 */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Funcionalidades Empresariales</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/admin/analytics">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Analytics Avanzado</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    KPIs, métricas financieras y dashboards interactivos
                  </p>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    Nuevo
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/scoring">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Calculator className="h-6 w-6 text-purple-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Scoring Crediticio</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Evaluación automática de riesgo crediticio
                  </p>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                    Nuevo
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/payments">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <PaymentIcon className="h-6 w-6 text-green-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Pagos Openpay</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Procesamiento de pagos integrado
                  </p>
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    Nuevo
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/audit">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Shield className="h-6 w-6 text-orange-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Sistema de Auditoría</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Logs y trazabilidad completa del sistema
                  </p>
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700">
                    Nuevo
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Comunicaciones y Notificaciones - WhatsApp */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <MessageSquare className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Comunicaciones WhatsApp</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/whatsapp/config">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Settings className="h-6 w-6 text-green-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Configurar EvolutionAPI</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Configurar la integración con WhatsApp
                  </p>
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    Configuración
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/whatsapp/clients">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Bell className="h-6 w-6 text-blue-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Config. Clientes</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Gestionar notificaciones por cliente
                  </p>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    Notificaciones
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/whatsapp/messages">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <MessageSquare className="h-6 w-6 text-purple-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Dashboard Mensajes</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Monitorear mensajes enviados
                  </p>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                    Dashboard
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Gestión de Sistema y Archivos */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Folder className="h-5 w-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Sistema</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/admin/files">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <Folder className="h-6 w-6 text-blue-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Gestión de Archivos</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Administrar documentos y archivos del sistema
                  </p>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    Archivos
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/notifications">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-orange-100 rounded-lg">
                      <Bell className="h-6 w-6 text-orange-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Notificaciones</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Centro de notificaciones del sistema
                  </p>
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700">
                    Sistema
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/storage">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Cloud className="h-6 w-6 text-purple-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Almacenamiento</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Configurar servicios de almacenamiento
                  </p>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                    Config
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/message-recharges">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <Zap className="h-6 w-6 text-green-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Recarga Mensajes</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Gestionar recargas de mensajes WhatsApp
                  </p>
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    WhatsApp
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Configuración Avanzada */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <Settings className="h-5 w-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900">Configuración Avanzada</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/admin/settings">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-gray-100 rounded-lg">
                      <Settings className="h-6 w-6 text-gray-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Configuración</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Ajustes generales del sistema
                  </p>
                  <Badge variant="secondary" className="bg-gray-50 text-gray-700">
                    Sistema
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/modules">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-indigo-100 rounded-lg">
                      <Layers className="h-6 w-6 text-indigo-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Módulos</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Activar/desactivar módulos del sistema
                  </p>
                  <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">
                    Control
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/admin/config">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-teal-100 rounded-lg">
                      <Box className="h-6 w-6 text-teal-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Config. Sistema</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Configuración avanzada del sistema
                  </p>
                  <Badge variant="secondary" className="bg-teal-50 text-teal-700">
                    Avanzado
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        <Separator className="my-8" />

        {/* Solicitudes Pendientes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-600" />
                Solicitudes Pendientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="font-medium text-gray-900">Patricia Hernández</p>
                    <p className="text-sm text-gray-600">Préstamo Empresarial - $200,000</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">Score: 78</Badge>
                      <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">Bajo Riesgo</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/admin/scoring">
                      <Button size="sm" variant="outline">
                        <Calculator className="h-3 w-3 mr-1" />
                        Evaluar
                      </Button>
                    </Link>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Aprobar
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="font-medium text-gray-900">Miguel Torres</p>
                    <p className="text-sm text-gray-600">Préstamo Automotriz - $300,000</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">Score: 62</Badge>
                      <Badge variant="secondary" className="text-xs bg-yellow-100 text-yellow-800">Riesgo Medio</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href="/admin/scoring">
                      <Button size="sm" variant="outline">
                        <Calculator className="h-3 w-3 mr-1" />
                        Evaluar
                      </Button>
                    </Link>
                    <Button size="sm" variant="outline">
                      Revisar
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-600" />
                Resumen del Mes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Pagos Recibidos</span>
                <span className="text-sm font-medium text-green-600">$36,100</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nuevos Préstamos</span>
                <span className="text-sm font-medium text-blue-600">$150,000</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Mora Total</span>
                <span className="text-sm font-medium text-red-600">$0</span>
              </div>
              <hr />
              <div className="flex justify-between items-center font-medium">
                <span className="text-gray-900">Balance Neto</span>
                <span className="text-green-600">+$186,100</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/users">
            <Button className="w-full h-16 bg-blue-600 hover:bg-blue-700">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Gestionar Usuarios</p>
                  <p className="text-xs opacity-90">Asesores y Clientes</p>
                </div>
              </div>
            </Button>
          </Link>
          <Link href="/admin/loans">
            <Button className="w-full h-16 bg-green-600 hover:bg-green-700">
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Ver Préstamos</p>
                  <p className="text-xs opacity-90">Cartera Completa</p>
                </div>
              </div>
            </Button>
          </Link>
          <Link href="/admin/reports">
            <Button className="w-full h-16 bg-purple-600 hover:bg-purple-700">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Generar Reportes</p>
                  <p className="text-xs opacity-90">Análisis y Métricas</p>
                </div>
              </div>
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
