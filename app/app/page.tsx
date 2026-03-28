
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
  Smartphone,
  MessageSquare
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { PricingSection } from '@/components/landing/pricing-section';
import { motion } from 'framer-motion';

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
          case 'SUPER_ADMIN':
            console.log('Redirecting to SaaS Command Center');
            router.replace('/admin/saas');
            break;
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
      {/* Navigation - Premium Glassmorphism */}
      <nav className="bg-white/70 backdrop-blur-xl border-b border-white/40 sticky top-0 z-50 transition-all duration-300 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 lg:py-5">
            <div className="flex items-center space-x-3 group cursor-pointer">
              <div className="bg-gradient-to-br from-primary to-indigo-600 p-2 rounded-2xl shadow-lg shadow-primary/20 group-hover:scale-110 transition-transform duration-300">
                <Building2 className="h-6 lg:h-7 w-6 lg:w-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl lg:text-2xl font-black text-gray-900 tracking-tighter leading-none">EscalaFin</span>
                <span className="text-[10px] uppercase font-bold text-primary tracking-[0.2em] mt-0.5">Fintech SaaS</span>
              </div>
              <Badge variant="outline" className="hidden lg:inline-flex text-[9px] font-black uppercase tracking-widest border-primary/20 bg-primary/5 text-primary rounded-full px-2 py-0">v2.7.2</Badge>
            </div>

            <div className="flex items-center space-x-3 lg:space-x-6">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-sm font-bold text-gray-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                  Acceso
                </Button>
              </Link>
              <Link href="/auth/register-tenant">
                <Button className="relative group overflow-hidden bg-gradient-to-r from-primary to-indigo-600 hover:from-indigo-600 hover:to-primary text-white font-black rounded-2xl px-6 lg:px-8 h-12 shadow-xl shadow-primary/25 transition-all duration-500 hover:scale-[1.02] active:scale-[0.98]">
                  <span className="relative z-10 flex items-center gap-2">
                    <span className="hidden sm:inline">Empezar Ahora</span>
                    <span className="sm:hidden">Unirse</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>
      {/* Hero Section */}
      <section className="relative py-12 lg:py-24 overflow-hidden">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-indigo-200/20 rounded-full blur-[100px] animate-bounce-subtle" />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            <div className="space-y-6 lg:space-y-8 text-center lg:text-left">
              <div className="space-y-4">
                <div className="flex justify-center lg:justify-start">
                  <Badge variant="secondary" className="w-fit px-4 py-1.5 bg-primary/5 text-primary border-primary/20">
                    <Star className="w-3.5 h-3.5 mr-2 animate-pulse fill-primary/20" />
                    Plataforma Profesional de Crédito
                  </Badge>
                </div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-gray-900 leading-[1.1] tracking-tight">
                  Gestión Inteligente de
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-600 block mt-1">
                    Préstamos Digitales
                  </span>
                </h1>
                <p className="text-lg lg:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                  Automatiza tu negocio financiero con la suite más completa.
                  Gestión de cobranza, scoring de clientes y reportes en tiempo real desde cualquier dispositivo.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row flex-wrap justify-center lg:justify-start gap-4 pt-4">
                <Link href="/auth/login" className="w-full sm:w-auto">
                  <Button size="xl" className="group w-full sm:px-10 h-16 bg-gray-900 hover:bg-gray-800 text-white font-black rounded-2xl shadow-2xl shadow-gray-200 transition-all hover:-translate-y-1 active:translate-y-0">
                    Comenzar Gratis
                    <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
                  </Button>
                </Link>
                <div className="flex gap-4 w-full sm:w-auto">
                  <Button size="xl" variant="outline" className="flex-1 sm:px-10 h-16 bg-white/70 backdrop-blur-sm border-gray-200 hover:border-primary/30 hover:bg-white text-gray-900 font-bold rounded-2xl shadow-lg shadow-gray-100 transition-all hover:-translate-y-1 active:translate-y-0" onClick={() => {
                    document.getElementById('features-section')?.scrollIntoView({ behavior: 'smooth' });
                  }}>
                    <Play className="mr-3 h-5 w-5 fill-primary text-primary" />
                    Demo Interactiva
                  </Button>
                </div>
              </div>

              {/* Trust badges on mobile */}
              <div className="flex items-center justify-center lg:justify-start space-x-6 sm:space-x-8 pt-6 border-t border-gray-100 lg:border-none">
                <div className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl font-black text-gray-900">+500</div>
                  <div className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-gray-500">Clientes</div>
                </div>
                <div className="h-8 w-px bg-gray-100 hidden sm:block" />
                <div className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl font-black text-gray-900">99.9%</div>
                  <div className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-gray-500">Uptime</div>
                </div>
                <div className="h-8 w-px bg-gray-100 hidden sm:block" />
                <div className="text-center lg:text-left">
                  <div className="text-xl sm:text-2xl font-black text-gray-900">24/7</div>
                  <div className="text-[10px] sm:text-xs uppercase font-bold tracking-widest text-gray-500">Soporte</div>
                </div>
              </div>
            </div>

            {/* Dashboard Visualization - More impact on mobile */}
            <div className="relative mt-8 lg:mt-0 px-4 sm:px-0">
              <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-[80px] -z-10 animate-pulse lg:block hidden" />
              <div className="relative bg-white/70 backdrop-blur-md rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white p-4 sm:p-6 transition-all hover:shadow-[0_20px_60px_-15px_rgba(var(--primary-rgb),0.2)]">
                <div className="aspect-[16/10] bg-gradient-to-br from-gray-50 to-indigo-50/30 rounded-2xl flex items-center justify-center relative overflow-hidden group">
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                  <motion.div 
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="relative z-10 text-center space-y-4"
                  >
                    <div className="p-5 bg-white rounded-2xl shadow-xl w-fit mx-auto border border-gray-50">
                      <Building2 className="h-10 sm:h-12 w-10 sm:h-12 text-primary" />
                    </div>
                    <h3 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight">Dashboard Central</h3>
                    <p className="text-gray-500 text-xs sm:text-sm max-w-xs mx-auto font-medium">
                      Control total de tu financiera en la palma de tu mano
                    </p>
                  </motion.div>
                </div>
              </div>

              {/* More Floating elements for premium look */}
              <motion.div 
                animate={{ y: [0, 10, 0], x: [0, 5, 0] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="absolute -top-6 -left-2 sm:-left-6 bg-white rounded-2xl shadow-xl p-3 sm:p-4 border border-gray-50 flex items-center space-x-3"
              >
                <div className="bg-green-100 p-2 rounded-lg">
                   <CheckCircle className="h-4 sm:h-5 w-4 sm:w-5 text-green-600" />
                </div>
                <span className="text-xs sm:text-sm font-black text-gray-800 tracking-tighter">Cobros Validados</span>
              </motion.div>

              <motion.div 
                animate={{ y: [0, -15, 0], x: [0, -5, 0] }}
                transition={{ duration: 6, repeat: Infinity, delay: 1 }}
                className="absolute -bottom-8 -right-2 sm:-right-6 bg-white rounded-2xl shadow-xl p-3 sm:p-4 border border-gray-50 flex items-center space-x-3"
              >
                <div className="bg-blue-100 p-2 rounded-lg">
                  <TrendingUp className="h-4 sm:h-5 w-4 sm:w-5 text-blue-600" />
                </div>
                <span className="text-xs sm:text-sm font-black text-gray-800 tracking-tighter">Rendimiento +40%</span>
              </motion.div>
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
                icon: MessageSquare,
                title: "Conecta tu WhatsApp",
                description: "Automatiza notificaciones de cobro y recordatorios directamente a tus clientes"
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

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}

      <section className="py-24 relative overflow-hidden">
        {/* Modern dark gradient background */}
        <div className="absolute inset-0 bg-slate-950 -z-20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-slate-950 to-slate-950 -z-10 animate-pulse-slow"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-10">
          <div className="space-y-4">
            <h2 className="text-4xl lg:text-5xl font-black text-white leading-tight tracking-tighter">
              ¿Listo para transformar tu negocio?
            </h2>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
              Únete a cientos de empresas que ya están optimizando sus operaciones financieras con EscalaFin.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-4">
            <Link href="/auth/register-tenant" className="w-full sm:w-auto">
              <Button size="xl" className="w-full sm:px-10 h-16 bg-white hover:bg-white/90 text-slate-950 font-black rounded-2xl shadow-xl shadow-white/5 transition-transform hover:-translate-y-1">
                Iniciar Prueba Gratuita
                <ArrowRight className="ml-2 h-6 w-6" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto">
              <Button size="xl" variant="outline" className="w-full sm:px-10 h-16 border-white/20 text-white hover:bg-white/5 font-bold rounded-2xl transition-all">
                Iniciar Sesión
              </Button>
            </Link>
          </div>
          
          <div className="pt-8 flex items-center justify-center gap-8 grayscale opacity-40">
            <Shield className="h-8 w-8 text-white" />
            <TrendingUp className="h-8 w-8 text-white" />
            <Globe className="h-8 w-8 text-white" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
            <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="flex items-center space-x-3">
                <Building2 className="h-6 w-6 text-primary" />
                <span className="text-xl font-black tracking-tighter">EscalaFin</span>
                <Badge variant="outline" className="border-gray-700 text-gray-400 bg-gray-800/50">v2.7.2</Badge>
              </div>
              <Separator orientation="vertical" className="h-4 bg-gray-800 hidden md:block" />
              <a 
                href="https://aurumcapital.mx" 
                target="_blank" 
                rel="noopener noreferrer"
                className="group flex items-center gap-2 px-3 py-1 bg-gray-800/30 rounded-full border border-gray-800 hover:border-primary/50 transition-all"
              >
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Powered by</span>
                <span className="text-xs font-black text-gray-300 group-hover:text-primary transition-colors">AurumCapital.mx</span>
              </a>
            </div>

            <div className="flex items-center space-x-6">
              <a
                href="https://wa.me/524424000742"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-gray-400 hover:text-green-400 transition-colors flex items-center gap-2"
              >
                <Smartphone className="h-4 w-4" />
                Soporte WhatsApp: 442 400 0742
              </a>
              <div className="text-sm text-gray-400 text-center md:text-left">
                © 2025 EscalaFin. Sistema de Gestión de Créditos y Préstamos.
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      <motion.div
        initial={{ opacity: 0, scale: 0.5, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="fixed bottom-6 right-6 z-[100]"
      >
        <a
          href="https://wa.me/524424000742?text=Hola,%20me%20interesa%20EscalaFin"
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex items-center gap-3 bg-[#25D366] hover:bg-[#128C7E] text-white p-3.5 lg:p-4 rounded-full shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95 border-2 border-white/20 sm:mb-env(safe-area-inset-bottom) sm:mr-env(safe-area-inset-right)"
        >
          {/* Pulse Effect */}
          <div className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-20 pointer-events-none" />
          
          <div className="flex flex-col items-end">
            <span className="max-w-0 overflow-hidden lg:group-hover:max-w-xs transition-all duration-500 ease-in-out whitespace-nowrap text-xs lg:text-sm font-bold pr-2">
              Hablar con soporte
            </span>
          </div>

          <svg 
            viewBox="0 0 24 24" 
            className="w-6 h-6 lg:w-8 lg:h-8 fill-current"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .01 5.437.01 12.045c0 2.112.552 4.173 1.594 6.002L0 24l6.117-1.605a11.772 11.772 0 005.925 1.585h.005c6.604 0 12.039-5.438 12.043-12.045a11.796 11.796 0 00-3.479-8.528z" />
          </svg>
        </a>
      </motion.div>
    </div>
  );
}
