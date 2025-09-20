
'use client';

import { useSession, signOut } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Building2, Users, FileText, DollarSign, TrendingUp, Plus, LogOut } from 'lucide-react';
import { toast } from 'sonner';

export function AsesorDashboard() {
  const { data: session, status } = useSession() || {};



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
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <Building2 className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-xl font-bold text-gray-900">EscalaFin</h1>
                <p className="text-xs text-gray-500">Portal del Asesor</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {session?.user?.name}
                </p>
                <p className="text-xs text-gray-500">Asesor</p>
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
          <Button className="h-16 bg-blue-600 hover:bg-blue-700">
            <div className="flex items-center gap-3">
              <Plus className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Nuevo Cliente</p>
                <p className="text-xs opacity-90">Registrar cliente</p>
              </div>
            </div>
          </Button>
          <Button className="h-16 bg-green-600 hover:bg-green-700">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Solicitar Crédito</p>
                <p className="text-xs opacity-90">Nueva solicitud</p>
              </div>
            </div>
          </Button>
          <Button className="h-16 bg-purple-600 hover:bg-purple-700">
            <div className="flex items-center gap-3">
              <DollarSign className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Registrar Pago</p>
                <p className="text-xs opacity-90">Cobros y pagos</p>
              </div>
            </div>
          </Button>
        </div>
      </main>
    </div>
  );
}
