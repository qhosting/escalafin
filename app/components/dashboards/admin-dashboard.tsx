
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, CreditCard, DollarSign, TrendingUp, FileText, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export function AdminDashboard() {
  const { data: session } = useSession() || { data: null };

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
          <h2 className="text-2xl font-bold text-gray-900">
            Bienvenido, {session?.user?.name?.split(' ')[0]}
          </h2>
          <p className="text-gray-600">
            Supervisa las operaciones diarias y gestiona la cartera de préstamos
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

        {/* Quick Actions Grid */}
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
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Ver Detalles</Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Aprobar
                    </Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div>
                    <p className="font-medium text-gray-900">Miguel Torres</p>
                    <p className="text-sm text-gray-600">Préstamo Automotriz - $300,000</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Ver Detalles</Button>
                    <Button size="sm" className="bg-green-600 hover:bg-green-700">
                      Aprobar
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
          <Button className="h-16 bg-blue-600 hover:bg-blue-700">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Gestionar Usuarios</p>
                <p className="text-xs opacity-90">Asesores y Clientes</p>
              </div>
            </div>
          </Button>
          <Button className="h-16 bg-green-600 hover:bg-green-700">
            <div className="flex items-center gap-3">
              <CreditCard className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Ver Préstamos</p>
                <p className="text-xs opacity-90">Cartera Completa</p>
              </div>
            </div>
          </Button>
          <Button className="h-16 bg-purple-600 hover:bg-purple-700">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Generar Reportes</p>
                <p className="text-xs opacity-90">Análisis y Métricas</p>
              </div>
            </div>
          </Button>
        </div>
      </main>
    </div>
  );
}
