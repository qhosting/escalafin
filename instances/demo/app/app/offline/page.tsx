
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    window.location.reload();
  };

  const goHome = () => {
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <WifiOff className="h-16 w-16 text-gray-400" />
          </div>
          <CardTitle>Sin Conexión</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-gray-600">
            No hay conexión a internet. Algunas funcionalidades pueden estar limitadas.
          </p>
          
          <div className="space-y-2">
            <Button onClick={handleRetry} className="w-full">
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </Button>
            <Button variant="outline" onClick={goHome} className="w-full">
              <Home className="h-4 w-4 mr-2" />
              Ir al Inicio
            </Button>
          </div>

          <div className="text-sm text-gray-500 mt-6">
            <p className="font-medium mb-2">Funcionalidades disponibles offline:</p>
            <ul className="text-left space-y-1">
              <li>• Ver datos previamente cargados</li>
              <li>• Consultar información de clientes</li>
              <li>• Revisar historial de pagos</li>
              <li>• Acceder a reportes guardados</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
