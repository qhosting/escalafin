
'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Users,
  MapPin,
  DollarSign,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function MobileDashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState({
    assignedClients: 0,
    pendingVisits: 0,
    collectedToday: 0,
    pendingAmount: 0
  });

  useEffect(() => {
    // Aquí cargaríamos estadísticas reales
    // Por ahora simulamos
    setStats({
      assignedClients: 24,
      pendingVisits: 5,
      collectedToday: 1500,
      pendingAmount: 3200
    });
  }, []);

  return (
    <div className="container mx-auto px-4 py-6 space-y-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Hola, {session?.user?.name || 'Asesor'}
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Resumen de hoy
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <Users className="h-8 w-8 text-blue-600 mb-2" />
            <p className="text-2xl font-bold text-blue-700">{stats.assignedClients}</p>
            <p className="text-xs text-blue-600">Clientes</p>
          </CardContent>
        </Card>

        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <DollarSign className="h-8 w-8 text-green-600 mb-2" />
            <p className="text-2xl font-bold text-green-700">${stats.collectedToday}</p>
            <p className="text-xs text-green-600">Cobrado Hoy</p>
          </CardContent>
        </Card>

        <Card className="bg-orange-50 border-orange-200">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <MapPin className="h-8 w-8 text-orange-600 mb-2" />
            <p className="text-2xl font-bold text-orange-700">{stats.pendingVisits}</p>
            <p className="text-xs text-orange-600">Visitas Pendientes</p>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4 flex flex-col items-center justify-center text-center">
            <AlertCircle className="h-8 w-8 text-red-600 mb-2" />
            <p className="text-2xl font-bold text-red-700">${stats.pendingAmount}</p>
            <p className="text-xs text-red-600">Por Cobrar</p>
          </CardContent>
        </Card>
      </div>

      <div className="pt-4">
        <h2 className="text-lg font-semibold mb-3">Acciones Rápidas</h2>
        <div className="grid gap-3">
          <Link href="/mobile/visits/new">
            <Button className="w-full justify-start" size="lg">
              <MapPin className="mr-2 h-5 w-5" />
              Registrar Visita
            </Button>
          </Link>
          <Link href="/mobile/clients">
            <Button variant="outline" className="w-full justify-start" size="lg">
              <Users className="mr-2 h-5 w-5" />
              Mis Clientes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
