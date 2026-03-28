
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
    if (status === 'authenticated' && session?.user?.role) {
      const timeoutId = setTimeout(() => {
        switch (session.user.role) {
          case 'SUPER_ADMIN': router.replace('/admin/saas'); break;
          case 'ADMIN':       router.replace('/admin/dashboard'); break;
          case 'ASESOR':      router.replace('/asesor/dashboard'); break;
          case 'CLIENTE':     router.replace('/cliente/dashboard'); break;
          default:            router.replace('/auth/login');
        }
      }, 100);
      return () => clearTimeout(timeoutId);
    }
  }, [session, status, router]);

  if (!mounted) return null;

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Iniciando EscalaFin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 selection:bg-primary/10 selection:text-primary">
      {/* ── Navigation - Glassmorphism Ultra ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-white/50 shadow-sm transition-all duration-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group transition-all">
              <div className="bg-primary p-2.5 rounded-2xl shadow-lg shadow-primary/20 group-hover:scale-105 group-hover:rotate-3 transition-all duration-300">
                <Building2 className="h-6 lg:h-7 w-6 lg:w-7 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl lg:text-2xl font-black text-slate-900 tracking-tighter leading-none">EscalaFin</span>
                <span className="text-[10px] uppercase font-bold text-primary tracking-[0.2em] mt-1">Fintech SaaS</span>
              </div>
            </Link>

            {/* Nav Buttons */}
            <div className="flex items-center space-x-2 sm:space-x-5">
              <Link href="/auth/login">
                <Button variant="ghost" className="text-sm font-bold text-slate-600 hover:text-primary hover:bg-primary/5 rounded-xl transition-all h-11 px-5">
                  Iniciar Sesión
                </Button>
              </Link>
              <Link href="/auth/register-tenant">
                <Button className="bg-primary hover:bg-primary/95 text-white font-black rounded-xl px-6 lg:px-8 h-11 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]">
                  <span className="flex items-center gap-2">
                    <span className="hidden sm:inline">Comenzar Ahora</span>
                    <span className="sm:hidden">Empezar</span>
                    <ArrowRight className="w-5 h-5 hidden sm:block" />
                  </span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative pt-32 lg:pt-48 pb-20 overflow-hidden">
        {/* Background Blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-[20%] right-[-5%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[100px] animate-bounce-subtle" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Content Left */}
            <div className="space-y-10 text-center lg:text-left animate-in fade-in slide-in-from-left-8 duration-1000">
              <div className="space-y-6">
                <Badge variant="secondary" className="px-4 py-1.5 bg-primary/5 text-primary border-primary/20 font-bold tracking-tight">
                  <Star className="w-4 h-4 mr-2 fill-primary/20" />
                  Plataforma Profesional de Crédito
                </Badge>
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
                  Gestión Inteligente de
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-indigo-600 to-primary bg-[length:200%_auto] animate-gradient-x block mt-2">
                    Préstamos Digitales
                  </span>
                </h1>
                <p className="text-xl text-slate-500 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-medium">
                  Automatiza tu financiera con la suite más robusta. Cobranza, scoring y reportes en tiempo real desde cualquier rincón del mundo.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6">
                <Link href="/auth/register-tenant" className="w-full sm:w-auto">
                  <Button size="xl" className="w-full sm:px-12 h-16 bg-primary hover:bg-primary/95 text-white font-black rounded-2xl shadow-2xl shadow-primary/30 transition-all duration-300 hover:scale-[1.05] active:scale-[0.98] group">
                    Comenzar Gratis
                    <ArrowRight className="h-6 w-6 ml-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="#demo" className="w-full sm:w-auto text-slate-600 hover:text-primary transition-all font-bold">
                   <Button size="xl" variant="outline" className="w-full sm:px-10 h-16 border-2 border-slate-200 bg-white hover:bg-slate-50 hover:border-primary/20 text-slate-700 font-bold rounded-2xl shadow-xl shadow-slate-200/50 transition-all duration-300">
                    <Play className="h-6 w-6 mr-3 fill-slate-300 group-hover:fill-primary transition-colors" />
                    Demo Interactiva
                  </Button>
                </Link>
              </div>

              {/* Trust Metric */}
              <div className="pt-10 flex items-center justify-center lg:justify-start gap-12 border-t border-slate-100 mt-10">
                <div>
                  <div className="text-3xl font-black text-slate-900">+500</div>
                  <div className="text-xs uppercase font-black tracking-widest text-slate-400">Financieras</div>
                </div>
                <div className="h-10 w-px bg-slate-200" />
                <div>
                  <div className="text-3xl font-black text-slate-900">99.9%</div>
                  <div className="text-xs uppercase font-black tracking-widest text-slate-400">Disponibilidad</div>
                </div>
              </div>
            </div>

            {/* Visualization Right */}
            <div className="relative group animate-in fade-in slide-in-from-right-12 duration-1000 delay-200">
              <div className="absolute -inset-4 bg-gradient-to-tr from-primary/10 to-indigo-500/10 rounded-[40px] blur-3xl -z-10 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative bg-white/60 backdrop-blur-md rounded-[40px] border border-white p-6 shadow-2xl overflow-hidden shadow-primary/5">
                 <div className="aspect-[4/3] rounded-3xl bg-slate-100/50 overflow-hidden relative flex flex-col items-center justify-center text-center p-8">
                    <motion.div 
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 4, repeat: Infinity }}
                      className="space-y-6"
                    >
                      <div className="bg-white p-6 rounded-3xl shadow-xl border border-white/50 w-fit mx-auto">
                        <Building2 className="h-14 w-14 text-primary" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-2xl font-black text-slate-900">Dashboard Central</h3>
                        <p className="text-slate-500 font-medium max-w-xs leading-snug">Control total de tu financiera en la palma de tu mano.</p>
                      </div>
                    </motion.div>
                 </div>
                 
                 {/* Floating Badges */}
                 <motion.div 
                  animate={{ x: [0, 5, 0], y: [0, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity }}
                  className="absolute top-10 -left-6 bg-white rounded-2xl shadow-2xl p-4 border border-slate-50 flex items-center gap-3"
                 >
                    <div className="bg-green-100 p-2 rounded-xl"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                    <span className="font-black text-slate-900">Cobros Al Día</span>
                 </motion.div>
                 
                 <motion.div 
                  animate={{ x: [0, -5, 0], y: [0, 5, 0] }}
                  transition={{ duration: 6, repeat: Infinity, delay: 0.5 }}
                  className="absolute bottom-10 -right-6 bg-white rounded-2xl shadow-2xl p-4 border border-slate-50 flex items-center gap-3"
                 >
                    <div className="bg-blue-100 p-2 rounded-xl"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
                    <span className="font-black text-slate-900">Mora -15%</span>
                 </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features-section" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-20 max-w-3xl mx-auto">
            <Badge variant="outline" className="px-4 py-1 text-primary border-primary/20 bg-primary/5 uppercase font-black text-[10px] tracking-widest">ECOSISTEMA INTEGRAL</Badge>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">Poderosa Gestión de Créditos</h2>
            <p className="text-lg text-slate-500 font-medium">Todo lo que necesitas para escalar tu financiera al siguiente nivel con tecnología de clase mundial.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {[
              { icon: Users, title: "Gestión de Clientes", desc: "Perfiles 360° con historial, documentos y scoring automatizado." },
              { icon: CreditCard, title: "Ciclo de Crédito", desc: "Desde la solicitud hasta la liquidación final con total trazabilidad." },
              { icon: BarChart3, title: "Analytics Real-time", desc: "Toma decisiones basadas en datos con dashboards de alto impacto." },
              { icon: Shield, title: "Seguridad Bancaria", desc: "Tus datos están protegidos con encriptación de grado militar." },
              { icon: Smartphone, title: "Acceso Móvil", desc: "Gestiona tu negocio desde cualquier lugar con nuestra PWA optimizada." },
              { icon: MessageSquare, title: "WhatsApp Business", desc: "Notificaciones automáticas y cobranza proactiva vía mensajería." }
            ].map((f, i) => (
              <div key={i} className="group p-8 bg-slate-50 rounded-[32px] hover:bg-white hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 border border-slate-100 hover:border-primary/20">
                <div className="p-4 bg-primary/10 rounded-2xl w-fit mb-6 group-hover:scale-110 group-hover:-rotate-3 transition-transform duration-300">
                  <f.icon className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <PricingSection />

      {/* ── CTA Final ── */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-slate-950 -z-20"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/30 via-slate-950 to-slate-950 -z-10 animate-pulse-slow"></div>
        
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12 animate-in fade-in zoom-in duration-1000">
          <div className="space-y-4">
            <h2 className="text-5xl lg:text-7xl font-black text-white leading-[1.05] tracking-tighter">
              ¿Listo para dar el siguiente paso?
            </h2>
            <p className="text-xl text-slate-400 font-medium max-w-2xl mx-auto">
              Únete a las mejores financieras de México que ya operan con EscalaFin.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <Link href="/auth/register-tenant" className="w-full sm:w-auto">
              <Button size="xl" className="w-full sm:px-14 h-16 bg-white hover:bg-slate-100 text-slate-950 font-black rounded-2xl shadow-2xl transition-all duration-300 hover:scale-[1.05] active:scale-[0.95]">
                Comenzar Ahora
                <ArrowRight className="ml-3 h-6 w-6" />
              </Button>
            </Link>
            <Link href="/auth/login" className="w-full sm:w-auto font-black text-white hover:text-white/80 transition-all text-lg">
               Iniciar Sesión
            </Link>
          </div>
          
          <div className="pt-10 flex items-center justify-center gap-10 opacity-30 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-700">
            <Shield className="h-10 w-10 text-white" />
            <TrendingUp className="h-10 w-10 text-white" />
            <Globe className="h-10 w-10 text-white" />
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-10 border-b border-slate-900 pb-16">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <Link href="/" className="flex items-center space-x-3">
                <Building2 className="h-7 w-7 text-primary" />
                <span className="text-2xl font-black tracking-tighter">EscalaFin</span>
                <Badge variant="outline" className="border-slate-800 text-slate-500 bg-slate-900/50">v2.7.2</Badge>
              </Link>
              <Separator orientation="vertical" className="h-6 bg-slate-800 hidden md:block" />
              <a href="https://aurumcapital.mx" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2.5 px-4 py-2 bg-slate-900/40 rounded-full border border-slate-900 hover:border-primary/40 transition-all">
                <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Powered by</span>
                <span className="text-sm font-black text-slate-300 group-hover:text-primary transition-colors">AurumCapital.mx</span>
              </a>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-8">
              <a href="https://wa.me/524424000742" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-400 hover:text-green-400 transition-colors flex items-center gap-3">
                <Smartphone className="h-5 w-5" />
                Soporte: 442 400 0742
              </a>
              <div className="text-sm font-medium text-slate-600">
                © 2025 EscalaFin. Todos los derechos reservados.
              </div>
            </div>
          </div>
        </div>
      </footer>

      {/* ── WhatsApp Float ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed bottom-8 right-8 z-[100]"
      >
        <a href="https://wa.me/524424000742" target="_blank" rel="noopener noreferrer" className="flex items-center gap-4 bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-90 transition-all group">
            <div className="hidden lg:group-hover:block pl-2 text-sm font-black animate-in fade-in slide-in-from-right-4">Soporte EscalaFin</div>
            <svg viewBox="0 0 24 24" className="w-8 h-8 fill-current"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.445 0 .01 5.437.01 12.045c0 2.112.552 4.173 1.594 6.002L0 24l6.117-1.605a11.772 11.772 0 005.925 1.585h.005c6.604 0 12.039-5.438 12.043-12.045a11.796 11.796 0 00-3.479-8.528z" /></svg>
        </a>
      </motion.div>
    </div>
  );
}
