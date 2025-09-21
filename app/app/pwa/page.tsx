
'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Smartphone, 
  Users, 
  BarChart3, 
  ArrowRight, 
  Download,
  Wifi,
  Shield,
  Zap
} from 'lucide-react';

export default function PWAHomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Auto-redirect based on user role after 3 seconds
    if (session?.user) {
      const timer = setTimeout(() => {
        switch (session.user.role) {
          case 'CLIENTE':
            router.push('/pwa/client');
            break;
          case 'ASESOR':
            router.push('/pwa/asesor');
            break;
          case 'ADMIN':
            router.push('/pwa/reports');
            break;
          default:
            router.push('/');
        }
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [session, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    router.push('/auth/login');
    return null;
  }

  const pwaOptions = [
    {
      title: 'Portal Cliente',
      description: 'Consulta tus préstamos, realiza pagos y más',
      icon: Smartphone,
      color: 'bg-blue-600',
      path: '/pwa/client',
      role: 'CLIENTE'
    },
    {
      title: 'Portal Asesor',
      description: 'Gestiona clientes y cobranza móvil',
      icon: Users,
      color: 'bg-green-600',
      path: '/pwa/asesor',
      role: 'ASESOR'
    },
    {
      title: 'Dashboard Reportes',
      description: 'Analytics y reportes ejecutivos',
      icon: BarChart3,
      color: 'bg-purple-600',
      path: '/pwa/reports',
      role: 'ADMIN'
    }
  ];

  const features = [
    {
      icon: Download,
      title: 'Instalable',
      description: 'Instala la app en tu dispositivo'
    },
    {
      icon: Wifi,
      title: 'Funciona Offline',
      description: 'Acceso sin conexión a internet'
    },
    {
      icon: Shield,
      title: 'Seguro',
      description: 'Datos protegidos y encriptados'
    },
    {
      icon: Zap,
      title: 'Rápido',
      description: 'Carga instantánea y fluida'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm p-6">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            EscalaFin PWA
          </h1>
          <p className="text-gray-600">
            Elige tu aplicación personalizada
          </p>
        </div>
      </div>

      {/* PWA Options */}
      <div className="max-w-4xl mx-auto p-6">
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {pwaOptions.map((option, index) => {
            const Icon = option.icon;
            const canAccess = session?.user?.role === 'ADMIN' || 
                            session?.user?.role === option.role;

            return (
              <Card 
                key={index} 
                className={`transition-all duration-300 hover:shadow-lg ${
                  !canAccess ? 'opacity-50' : 'hover:-translate-y-1'
                }`}
              >
                <CardHeader className="text-center">
                  <div className={`w-16 h-16 ${option.color} rounded-full flex items-center justify-center mx-auto mb-4`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{option.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-gray-600 mb-6">
                    {option.description}
                  </p>
                  <Button
                    onClick={() => router.push(option.path)}
                    disabled={!canAccess}
                    className="w-full"
                  >
                    Abrir App
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Auto-redirect notice */}
        {session?.user && (
          <Card className="bg-blue-50 border-blue-200 mb-8">
            <CardContent className="p-6 text-center">
              <div className="animate-pulse">
                <p className="text-blue-800 font-medium">
                  Redirigiendo automáticamente a tu aplicación...
                </p>
                <div className="w-full bg-blue-200 rounded-full h-2 mt-3">
                  <div className="bg-blue-600 h-2 rounded-full w-1/3 animate-pulse"></div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div key={index} className="text-center">
                <div className="bg-white rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3 shadow-md">
                  <Icon className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm text-gray-600">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
