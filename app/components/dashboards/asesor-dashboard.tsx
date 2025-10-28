
'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, DollarSign, TrendingUp, Plus, CreditCard, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function AsesorDashboard() {
  const { data: session, status } = useSession() || {};

  const stats = [
    {
      title: 'Mis Clientes',
      value: '3',
      change: '+1',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Cartera Asignada',
      value: '$400,000',
      change: '+5%',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Solicitudes Enviadas',
      value: '2',
      change: '+2',
      icon: FileText,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Meta Mensual',
      value: '67%',
      change: '+12%',
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Hola, {session?.user?.name?.split(' ')[0]}
          </h2>
          <p className="text-gray-600">
            Gestiona tu cartera de clientes y solicitudes de crédito
          </p>
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

        {/* Gestión de Préstamos - Acceso Rápido */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="h-5 w-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900">Gestión de Préstamos</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Link href="/asesor/credit-applications">
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
                    Crear y gestionar solicitudes de mis clientes
                  </p>
                  <Badge variant="secondary" className="bg-orange-50 text-orange-700">
                    Workflow
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/asesor/loans">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-green-100 rounded-lg">
                      <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Mis Préstamos</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Ver y gestionar préstamos de mis clientes
                  </p>
                  <Badge variant="secondary" className="bg-green-50 text-green-700">
                    Gestión
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/asesor/loans/new">
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
                    Crear préstamo para un cliente asignado
                  </p>
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    Crear
                  </Badge>
                </CardContent>
              </Card>
            </Link>

            <Link href="/asesor/clients">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 bg-purple-100 rounded-lg">
                      <Users className="h-6 w-6 text-purple-600" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">Mis Clientes</h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Gestionar mis clientes asignados
                  </p>
                  <Badge variant="secondary" className="bg-purple-50 text-purple-700">
                    CRM
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          </div>
        </div>

        {/* Client and Applications Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                Mis Clientes
              </CardTitle>
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Nuevo
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-gray-900">Juan Pérez</p>
                    <p className="text-sm text-gray-600">Préstamo Personal - $100,000</p>
                  </div>
                  <Button size="sm" variant="outline">Ver</Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-gray-900">Ana Martínez</p>
                    <p className="text-sm text-gray-600">Préstamo Empresarial - $250,000</p>
                  </div>
                  <Button size="sm" variant="outline">Ver</Button>
                </div>
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div>
                    <p className="font-medium text-gray-900">Roberto Sánchez</p>
                    <p className="text-sm text-gray-600">Préstamo Personal - $150,000</p>
                  </div>
                  <Button size="sm" variant="outline">Ver</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-600" />
                Estado de Solicitudes
              </CardTitle>
              <Button size="sm" className="flex items-center gap-1">
                <Plus className="w-4 h-4" />
                Nueva
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="font-medium text-gray-900">Patricia Hernández</p>
                    <p className="text-sm text-yellow-700">En Revisión - $200,000</p>
                  </div>
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                    Pendiente
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="font-medium text-gray-900">Miguel Torres</p>
                    <p className="text-sm text-yellow-700">En Evaluación - $300,000</p>
                  </div>
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded-full">
                    Pendiente
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div>
                    <p className="font-medium text-gray-900">Roberto Sánchez</p>
                    <p className="text-sm text-green-700">Aprobado - $150,000</p>
                  </div>
                  <span className="text-xs bg-green-200 text-green-800 px-2 py-1 rounded-full">
                    Aprobado
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Performance */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-600" />
              Rendimiento del Mes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">3</p>
                <p className="text-sm text-gray-600">Préstamos Otorgados</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">$500,000</p>
                <p className="text-sm text-gray-600">Monto Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">7</p>
                <p className="text-sm text-gray-600">Pagos Recibidos</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">67%</p>
                <p className="text-sm text-gray-600">Meta Alcanzada</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link href="/admin/clients/new">
            <Button className="h-16 w-full bg-blue-600 hover:bg-blue-700">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Nuevo Cliente</p>
                  <p className="text-xs opacity-90">Registrar cliente</p>
                </div>
              </div>
            </Button>
          </Link>
          <Link href="/asesor/credit-applications">
            <Button className="h-16 w-full bg-green-600 hover:bg-green-700">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Solicitar Crédito</p>
                  <p className="text-xs opacity-90">Nueva solicitud</p>
                </div>
              </div>
            </Button>
          </Link>
          <Link href="/mobile/collection">
            <Button className="h-16 w-full bg-purple-600 hover:bg-purple-700">
              <div className="flex items-center gap-3">
                <DollarSign className="w-5 h-5" />
                <div className="text-left">
                  <p className="font-medium">Registrar Pago</p>
                  <p className="text-xs opacity-90">Cobros y pagos</p>
                </div>
              </div>
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
