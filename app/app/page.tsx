
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
  MessageSquare,
  ChevronRight
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
      router.replace('/admin/dashboard');
    }
  }, [session, status, router]);

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Fixed Navigation bar ── */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-b border-gray-100 h-20 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center">
            {/* Logo Group */}
            <Link href="/" className="flex items-center gap-3">
              <div className="bg-[#003d7a] p-2.5 rounded-2xl shadow-lg shadow-blue-900/10">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-xl font-black text-slate-900 tracking-tighter">EscalaFin</span>
                <span className="text-[10px] font-bold text-[#00b4d8] uppercase tracking-widest pl-0.5">Fintech SaaS</span>
              </div>
            </Link>

            {/* Navigation items */}
            <div className="flex items-center gap-2 sm:gap-6">
              <Link href="/auth/login" className="text-sm font-bold text-slate-500 hover:text-slate-900 transition-colors px-4 py-2">
                Iniciar Sesión
              </Link>
              <Link href="/auth/register-tenant">
                <Button className="bg-[#003d7a] hover:bg-[#002d5a] text-white font-black rounded-xl px-7 h-11 text-sm shadow-xl shadow-blue-900/20 transition-all hover:scale-105 active:scale-95">
                  Registrarse
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero section ── */}
      <section className="relative pt-40 lg:pt-56 pb-24 overflow-hidden bg-gradient-to-br from-slate-50 via-white to-white">
        {/* Animated Background blobs */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[60%] h-[60%] bg-blue-100/30 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-[40%] h-[40%] bg-sky-100/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Hero Left Content */}
            <div className="space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-full text-[#003d7a] text-xs font-bold uppercase tracking-widest shadow-sm">
                 <Star className="w-3.5 h-3.5 fill-[#003d7a]/20" />
                 Plataforma Profesional de Crédito
              </div>
              
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tight">
                Gestión Inteligente de
                <span className="block text-[#003d7a] mt-2">Préstamos Digitales</span>
              </h1>

              <p className="text-xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Lleva tu financiera al siguiente nivel con EscalaFin. Automatización de cobranza, scoring de clientes y reportes inteligentes todo en uno.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-4">
                 <Link href="/auth/register-tenant" className="w-full sm:w-auto">
                    <Button className="w-full sm:px-10 h-16 bg-[#003d7a] hover:bg-[#002d5a] text-white font-black text-lg rounded-2xl shadow-2xl shadow-blue-900/20 transition-all hover:scale-[1.03] active:scale-[0.97] group">
                       Comenzar Gratis 
                       <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-all" />
                    </Button>
                 </Link>
                 <Link href="#demo" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:px-10 h-16 border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-bold text-lg rounded-2xl transition-all shadow-xl shadow-slate-100/50">
                       <Play className="mr-3 h-6 w-6 fill-slate-200" />
                       Demo Interactiva
                    </Button>
                 </Link>
              </div>

              {/* Stats badges */}
              <div className="flex items-center justify-center lg:justify-start gap-12 pt-8 border-t border-slate-100">
                <div>
                   <div className="text-2xl font-black text-slate-900">+500</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Financieras</div>
                </div>
                <div className="h-8 w-px bg-slate-200" />
                <div>
                   <div className="text-2xl font-black text-slate-900">99.9%</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Disponibilidad</div>
                </div>
              </div>
            </div>

            {/* Hero Right Visuals */}
            <div className="relative pt-12 lg:pt-0">
               <div className="absolute -inset-4 bg-[#003d7a]/5 rounded-[40px] blur-[60px] pointer-events-none" />
               <div className="relative bg-white border border-slate-100 p-6 rounded-[40px] shadow-2xl overflow-hidden group">
                  <div className="aspect-[4/3] rounded-[32px] bg-slate-50 flex flex-col items-center justify-center text-center p-8">
                     <motion.div 
                        animate={{ y: [0, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="p-6 bg-white rounded-3xl shadow-xl w-fit mb-6 border border-slate-50"
                     >
                        <Building2 size={56} className="text-[#003d7a]" />
                     </motion.div>
                     <h3 className="text-2xl font-black text-slate-900 mb-2">Dashboard Central</h3>
                     <p className="text-slate-500 font-medium">Todo bajo control en una sola pantalla</p>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-10 left-4 sm:-left-6 backdrop-blur-md bg-white/80 border border-white p-3 rounded-2xl shadow-xl flex items-center gap-3">
                     <div className="bg-green-100 p-2 rounded-xl"><CheckCircle className="h-5 w-5 text-green-600" /></div>
                     <span className="font-black text-slate-800 text-sm">Cobros Al Día</span>
                  </div>
                  <div className="absolute bottom-10 right-4 sm:-right-6 backdrop-blur-md bg-white/80 border border-white p-3 rounded-2xl shadow-xl flex items-center gap-3">
                     <div className="bg-[#003d7a]/10 p-2 rounded-xl"><TrendingUp className="h-5 w-5 text-[#003d7a]" /></div>
                     <span className="font-black text-slate-800 text-sm">Crecimiento +45%</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Section ── */}
      <section id="features-section" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-12">
          <div className="space-y-4 max-w-3xl mx-auto">
             <Badge variant="outline" className="px-5 py-1 text-[#003d7a] bg-[#003d7a]/5 border-[#003d7a]/10 font-black text-[10px] tracking-widest uppercase">Características</Badge>
             <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight leading-tight">Potencia tu Operación Financiera</h2>
             <p className="text-lg text-slate-500 font-medium">Automatizamos los procesos más complejos para que tú solo te preocupes por crecer.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 text-left">
            {[
              { icon: Users, title: "Gestión de Clientes", desc: "Perfiles completos con buró de crédito integrado y scoring dinámico." },
              { icon: CreditCard, title: "Control de Cartera", desc: "Gestión de pagos, moras y reprogramaciones de forma automática." },
              { icon: BarChart3, title: "Reportería Fiscal", desc: "Generación de reportes listos para contabilidad y auditorías." },
              { icon: Shield, title: "Seguridad Bancaria", desc: "Protocolos de encriptado SSL y almacenamiento seguro en la nube." },
              { icon: Smartphone, title: "Uso Móvil", desc: "Acceso total desde celular o tablet con nuestra PWA optimizada." },
              { icon: MessageSquare, title: "WhatsApp Business", desc: "Recordatorios de pago y cobranza preventiva vía WhatsApp." }
            ].map((f, i) => (
              <div key={i} className="group p-8 border border-slate-100 rounded-[32px] hover:bg-slate-50 transition-all hover:shadow-2xl hover:shadow-[#003d7a]/5">
                <div className="p-4 bg-[#003d7a]/5 rounded-2xl w-fit mb-6 text-[#003d7a] group-hover:bg-[#003d7a] group-hover:text-white transition-all duration-300">
                  <f.icon size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-3">{f.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <PricingSection />

      {/* ── Final CTA ── */}
      <section className="py-32 relative bg-slate-950 overflow-hidden text-center">
         <div className="absolute inset-0 bg-gradient-to-b from-[#003d7a]/20 to-transparent" />
         <div className="relative max-w-4xl mx-auto px-4 z-10 space-y-12">
            <h2 className="text-5xl lg:text-7xl font-black text-white leading-tight tracking-tighter italic">¿Listo para transformar tu negocio?</h2>
            <p className="text-xl text-slate-400 font-medium">Únete a cientos de empresas que ya optimizan sus finanzas con nosotros.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <Link href="/auth/register-tenant" className="w-full sm:w-auto">
                    <Button className="w-full sm:px-14 h-16 bg-white hover:bg-slate-100 text-[#003d7a] font-black text-xl rounded-2xl transition-all active:scale-95 shadow-2xl">
                       Comenzar Ahora
                       <ArrowRight className="ml-3 h-6 w-6" />
                    </Button>
                </Link>
                <Link href="/auth/login" className="text-white font-black hover:text-slate-300 transition-colors text-lg italic">
                   Iniciar Sesión
                </Link>
            </div>
         </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-slate-950 text-slate-500 py-16 border-t border-slate-900">
         <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-10">
            <div className="flex flex-col md:flex-row items-center gap-6">
               <div className="flex items-center gap-3">
                  <Building2 size={24} className="text-[#003d7a]" />
                  <span className="text-2xl font-black text-white tracking-tighter">EscalaFin</span>
               </div>
               <Separator orientation="vertical" className="h-5 bg-slate-800 hidden md:block" />
               <a href="https://aurumcapital.mx" target="_blank" className="flex items-center gap-2 group">
                  <span className="text-[10px] font-black uppercase tracking-widest">Powered by</span>
                  <span className="text-sm font-black text-slate-300 group-hover:text-[#00b4d8] transition-colors">AurumCapital.mx</span>
               </a>
            </div>
            <div className="flex flex-col md:flex-row gap-8 items-center text-sm font-medium">
               <a href="https://wa.me/524424000742" target="_blank" className="hover:text-green-500 transition-colors flex items-center gap-2">
                  <Smartphone className="h-4 w-4" /> 442 400 0742
               </a>
               <span>© 2025 EscalaFin. Todos los derechos reservados.</span>
            </div>
         </div>
      </footer>
    </div>
  );
}
