
'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  Building2, 
  Shield, 
  TrendingUp, 
  Users, 
  CreditCard, 
  BarChart3,
  ArrowRight,
  Play,
  CheckCircle,
  Star,
  Globe,
  Smartphone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    console.log('Page useEffect - status:', status, 'session:', session);
    
    // Solo redirigir si hay una sesión válida y está completamente cargada
    if (status === 'authenticated' && session?.user?.role) {
      console.log('Authenticated user with role:', session.user.role);
      
      // Pequeño delay para evitar hydration issues
      const timeoutId = setTimeout(() => {
        switch (session.user.role) {
          case 'ADMIN':
            console.log('Redirecting to admin dashboard');
            router.replace('/admin/dashboard');
            break;
          case 'ASESOR':
            console.log('Redirecting to asesor dashboard');
            router.replace('/asesor/dashboard');
            break;
          case 'CLIENTE':
            console.log('Redirecting to cliente dashboard');
            router.replace('/cliente/dashboard');
            break;
          default:
            console.log('Unknown role, redirecting to login');
            router.replace('/auth/login');
        }
      }, 100);

      return () => clearTimeout(timeoutId);
    } else if (status === 'unauthenticated') {
      console.log('User is not authenticated');
    }
  }, [session, status, router]);

  if (!mounted) {
    return null; // Evitar hidration mismatch
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  if (status === 'authenticated' && session?.user?.role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Redirigiendo al dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Building2 className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-gray-900">EscalaFin</span>
              <Badge variant="outline" className="hidden sm:inline-flex">Sistema de Gestión</Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="outline">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button>
                  Registrarse
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge variant="secondary" className="w-fit">
                  <Star className="w-3 h-3 mr-1" />
                  Plataforma Profesional
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Gestión Integral de 
                  <span className="text-primary block">Créditos y Préstamos</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Automatiza tu negocio financiero con nuestra plataforma completa. 
                  Gestiona clientes, préstamos, pagos y reportes desde una sola aplicación.
                </p>
              </div>

              <div className="flex flex-wrap gap-4">
                <Link href="/auth/login">
                  <Button size="lg" className="px-8">
                    Comenzar Ahora
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="px-8" onClick={() => {
                  // Scroll a la sección de features para mostrar funcionalidades
                  document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  <Play className="mr-2 h-4 w-4" />
                  Ver Demo
                </Button>
              </div>

              <div className="flex items-center space-x-8 pt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">500+</div>
                  <div className="text-sm text-gray-600">Clientes Activos</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">99.9%</div>
                  <div className="text-sm text-gray-600">Uptime</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-gray-900">24/7</div>
                  <div className="text-sm text-gray-600">Soporte</div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative bg-white rounded-2xl shadow-2xl p-6">
                <div className="aspect-video bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-indigo-500/20"></div>
                  <div className="relative z-10 text-center space-y-4">
                    <Building2 className="h-16 w-16 text-primary mx-auto" />
                    <h3 className="text-xl font-semibold text-gray-900">Dashboard Interactivo</h3>
                    <p className="text-gray-600 text-sm max-w-xs">
                      Visualiza todos tus datos financieros en tiempo real
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Floating Cards */}
              <div className="absolute -top-4 -left-4 bg-white rounded-lg shadow-lg p-3">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-medium">Pagos al día</span>
                </div>
              </div>
              
              <div className="absolute -bottom-4 -right-4 bg-white rounded-lg shadow-lg p-3">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  <span className="text-sm font-medium">+25% crecimiento</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features-section" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="outline">Características Principales</Badge>
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Todo lo que necesitas para gestionar tu negocio
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Desde la gestión de clientes hasta reportes avanzados, 
              EscalaFin tiene todas las herramientas que necesitas
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: Users,
                title: "Gestión de Clientes",
                description: "Administra tu cartera de clientes con perfiles completos y historial financiero"
              },
              {
                icon: CreditCard,
                title: "Control de Préstamos",
                description: "Seguimiento completo del ciclo de vida de préstamos y créditos"
              },
              {
                icon: BarChart3,
                title: "Reportes Avanzados",
                description: "Analytics en tiempo real y reportes personalizables para tomar decisiones"
              },
              {
                icon: Shield,
                title: "Seguridad Máxima",
                description: "Encriptación de datos y cumplimiento con estándares de seguridad financiera"
              },
              {
                icon: Smartphone,
                title: "PWA Móvil",
                description: "Acceso desde cualquier dispositivo con nuestra aplicación web progresiva"
              },
              {
                icon: Globe,
                title: "Multi-moneda",
                description: "Soporte para múltiples monedas y tasas de cambio automáticas"
              }
            ].map((feature, index) => (
              <Card key={index} className="border-2 hover:border-primary/50 transition-colors group">
                <CardContent className="p-6 space-y-4">
                  <div className="p-3 bg-primary/10 rounded-lg w-fit group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-indigo-600"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl lg:text-4xl font-bold">
            ¿Listo para transformar tu negocio?
          </h2>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Únete a cientos de empresas que ya están optimizando sus operaciones financieras con EscalaFin
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/auth/register">
              <Button size="lg" variant="secondary" className="px-8">
                Crear Cuenta Gratis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button size="lg" variant="outline" className="px-8 border-white text-white hover:bg-white hover:text-primary">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="flex items-center space-x-3">
              <Building2 className="h-6 w-6" />
              <span className="text-lg font-bold">EscalaFin</span>
              <Badge variant="outline" className="border-gray-400 text-gray-700 bg-white">v1.0</Badge>
            </div>
            
            <div className="text-sm text-gray-400 text-center md:text-left">
              © 2025 EscalaFin. Sistema de Gestión de Créditos y Préstamos.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
