
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
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center">
            {/* Logo Group */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-[#003d7a] p-2 rounded-xl shadow-lg shadow-blue-900/10 transition-transform group-hover:scale-105">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-lg font-black text-[#003d7a] tracking-tighter">EscalaFin</span>
                <span className="text-[10px] font-bold text-[#00b4d8] uppercase tracking-widest pl-0.5">Fintech SaaS</span>
              </div>
            </Link>

            {/* Navigation items */}
            <div className="flex items-center gap-4 sm:gap-8">
              <Link href="/auth/login" className="text-sm font-black text-slate-500 hover:text-[#003d7a] transition-colors uppercase tracking-widest px-2">
                Entrar
              </Link>
              <Link href="/auth/register-tenant">
                <Button className="bg-[#003d7a] hover:bg-[#002d5a] text-white font-black rounded-lg px-6 h-10 text-xs shadow-lg shadow-blue-900/20 transition-all hover:translate-y-[-1px] active:translate-y-0">
                  CREAR CUENTA
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero section ── */}
      <section className="relative pt-28 lg:pt-40 pb-20 overflow-hidden bg-slate-50/10">
        {/* Background blobs for depth */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[700px] h-[700px] bg-blue-100/40 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Hero Left Content */}
            <div className="space-y-10 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-100 rounded-full text-[#003d7a] text-[10px] font-black uppercase tracking-[0.2em] shadow-sm">
                 <Star className="w-4 h-4 fill-[#003d7a]/20" />
                 PLATAFORMA PROFESIONAL DE CRÉDITO
              </div>
              
              <h1 className="text-5xl sm:text-7xl lg:text-8xl font-black text-slate-900 leading-[0.95] tracking-[ -0.05em]">
                Créditos <br />
                <span className="text-[#003d7a]">Inteligentes</span>
              </h1>

              <p className="text-lg lg:text-2xl text-slate-500 font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
                La suite más potente para la gestión financiera. <br className="hidden lg:block" /> 
                Escala tu negocio con tecnología de vanguardia.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-6 pt-4">
                 <Link href="/auth/register-tenant" className="w-full sm:w-auto">
                    <Button className="w-full sm:px-14 h-18 py-8 bg-[#003d7a] hover:bg-[#002d5a] text-white font-black text-xl rounded-2xl shadow-2xl shadow-blue-900/60 transition-all hover:scale-[1.05] active:scale-[0.98] group">
                       EMPEZAR GRATIS
                       <ArrowRight className="ml-4 h-6 w-6 group-hover:translate-x-2 transition-all" />
                    </Button>
                 </Link>
                 <Link href="#demo" className="w-full sm:w-auto">
                    <Button variant="outline" className="w-full sm:px-10 h-18 py-8 border-2 border-slate-200 bg-white hover:bg-slate-50 text-slate-900 font-black text-xl rounded-2xl transition-all shadow-xl shadow-slate-100/50">
                       VER DEMO
                    </Button>
                 </Link>
              </div>

              {/* Stats badges */}
              <div className="flex items-center justify-center lg:justify-start gap-16 pt-12 border-t border-slate-200/60 mt-12">
                <div>
                   <div className="text-3xl font-black text-slate-900">+500</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">FINANCIERAS</div>
                </div>
                <div>
                   <div className="text-3xl font-black text-slate-900">99.9%</div>
                   <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">UPTIME</div>
                </div>
              </div>
            </div>

            {/* Hero Right Visuals */}
            <div className="relative pt-12 lg:pt-0">
               <div className="absolute -inset-10 bg-[#003d7a]/10 rounded-full blur-[90px] pointer-events-none" />
               <div className="relative bg-white border border-slate-100 p-8 rounded-[48px] shadow-2xl overflow-hidden shadow-blue-900/5 transition-transform hover:scale-[1.02] duration-700">
                  <div className="aspect-[4/3] rounded-[40px] bg-slate-50 flex flex-col items-center justify-center text-center p-10 border border-slate-100">
                     <motion.div 
                        animate={{ y: [0, -15, 0] }}
                        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                        className="p-8 bg-white rounded-3xl shadow-xl w-fit mb-8 border border-slate-50"
                     >
                        <Building2 size={64} className="text-[#003d7a]" />
                     </motion.div>
                     <h3 className="text-3xl font-black text-slate-900 mb-2">ESCÁLAFIN</h3>
                     <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Control Total Garantizado</p>
                  </div>

                  {/* Badges */}
                  <div className="absolute top-12 -left-4 sm:-left-8 backdrop-blur-xl bg-[#003d7a] text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 transition-transform hover:scale-105">
                     <div className="bg-white/20 p-2 rounded-xl"><CheckCircle className="h-6 w-6" /></div>
                     <span className="font-black text-sm uppercase tracking-widest">Cobros Listos</span>
                  </div>
                  <div className="absolute bottom-12 -right-4 sm:-right-8 backdrop-blur-xl bg-[#00b4d8] text-white p-4 rounded-2xl shadow-2xl flex items-center gap-4 transition-transform hover:scale-105">
                     <div className="bg-white/20 p-2 rounded-xl"><TrendingUp className="h-6 w-6" /></div>
                     <span className="font-black text-sm uppercase tracking-widest">Morosidad ↓</span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features-section" className="py-32 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-16">
          <div className="space-y-4 max-w-4xl mx-auto">
             <Badge variant="outline" className="px-6 py-1.5 text-[#003d7a] bg-blue-50 border-blue-100 font-black text-[10px] tracking-widest uppercase mb-4">Módulos del Sistema</Badge>
             <h2 className="text-5xl lg:text-7xl font-black text-slate-900 tracking-tight leading-tighter">Tecnología de Alto Impacto</h2>
             <p className="text-xl lg:text-3xl text-slate-400 font-bold">Todo bajo el mismo techo, sin fricciones.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 text-left">
            {[
              { icon: Users, title: "Gestión de Clientes", desc: "Perfiles 360° con scoring predictivo y almacenamiento de documentos seguro." },
              { icon: CreditCard, title: "Ciclo de Crédito", desc: "Desde la originación hasta la cobranza judicial, el control es tuyo." },
              { icon: BarChart3, title: "Inteligencia de Negocios", desc: "Dashboards en tiempo real preparados para detectar cualquier anomalía." },
              { icon: Shield, title: "Seguridad Militar", desc: "Arquitectura redundante con encriptado de punta a punta (End-To-End)." },
              { icon: Smartphone, title: "Experiencia Mobile", desc: "Tu financiera en el bolsillo. App optimizada para cobradores de campo." },
              { icon: MessageSquare, title: "WhatsApp CRM", desc: "Envío masivo de recordatorios y gestión de cobranza preventiva automática." }
            ].map((f, i) => (
              <div key={i} className="group p-10 border border-slate-100 rounded-[40px] hover:bg-[#003d7a] transition-all duration-500 hover:shadow-2xl shadow-blue-900/20">
                <div className="p-5 bg-blue-50 rounded-2xl w-fit mb-8 text-[#003d7a] group-hover:bg-white/10 group-hover:text-white transition-all duration-300">
                  <f.icon size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 group-hover:text-white mb-4 transition-colors">{f.title}</h3>
                <p className="text-slate-500 font-bold group-hover:text-blue-100/60 leading-relaxed transition-colors">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <PricingSection />

      {/* ── Final Call to Action ── */}
      <section className="py-40 relative bg-slate-950 overflow-hidden text-center">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#003d7a]/40 via-transparent to-transparent opacity-50" />
         <div className="relative max-w-5xl mx-auto px-6 z-10 space-y-16">
            <h2 className="text-6xl lg:text-9xl font-black text-white leading-none tracking-tighter uppercase italic">
               DALE PODER A <br /> 
               <span className="text-[#00b4d8]">TU FINANCIERA</span>
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-8">
                <Link href="/auth/register-tenant" className="w-full sm:w-auto">
                    <Button className="w-full sm:px-16 h-20 bg-white hover:bg-slate-100 text-[#003d7a] font-black text-2xl rounded-3xl transition-all shadow-2xl shadow-white/10">
                       PROBAR AHORA
                    </Button>
                </Link>
                <Link href="/auth/login" className="text-white/60 font-black hover:text-white transition-colors text-xl uppercase tracking-widest border-b-2 border-transparent hover:border-white pb-1">
                   ENTRAR AL PORTAL
                </Link>
            </div>
         </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-white text-slate-400 py-24 border-t border-slate-100">
         <div className="max-w-7xl mx-auto px-4 flex flex-col items-center gap-16">
            <div className="flex flex-col md:flex-row items-center gap-10">
               <Link href="/" className="flex items-center gap-4">
                  <div className="bg-[#003d7a] p-2 rounded-xl"><Building2 size={24} className="text-white" /></div>
                  <span className="text-3xl font-black text-slate-900 tracking-tighter">EscalaFin</span>
               </Link>
               <Separator orientation="vertical" className="h-6 bg-slate-200 hidden md:block" />
               <a href="https://aurumcapital.mx" target="_blank" className="flex flex-col items-start gap-0 group">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#003d7a]">Socio Tecnológico</span>
                  <span className="text-lg font-black text-slate-900 group-hover:text-[#00b4d8] transition-colors leading-none tracking-tight">AurumCapital.mx</span>
               </a>
            </div>
            
            <div className="flex flex-col md:flex-row gap-12 items-center text-sm font-black uppercase tracking-widest">
               <a href="https://wa.me/524424000742" target="_blank" className="text-[#003d7a] hover:text-[#00b4d8] transition-all flex items-center gap-3">
                  <Smartphone className="h-5 w-5" /> WHATSAPP SOPORTE
               </a>
               <span>© 2025 ESCALAFIN • TODOS LOS DERECHOS RESERVADOS</span>
            </div>
         </div>
      </footer>

      {/* WhatsApp Floating Button */}
      <div className="fixed bottom-8 right-8 z-[200] group flex items-center">
        {/* Tooltip con efecto premium */}
        <span className="mr-4 bg-white dark:bg-slate-900 text-[#003d7a] dark:text-blue-400 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all duration-500 shadow-2xl border border-slate-100 dark:border-slate-800 pointer-events-none whitespace-nowrap translate-x-12 group-hover:translate-x-0">
           ¿Tienes dudas? ¡Escríbenos!
        </span>
        
        <a 
          href="https://wa.me/524424000742" 
          target="_blank" 
          rel="noopener noreferrer"
          className="relative flex items-center justify-center w-16 h-16 bg-[#25D366] text-white rounded-full shadow-2xl shadow-green-500/50 hover:scale-110 active:scale-95 transition-all duration-500 border-4 border-white dark:border-slate-900"
        >
          {/* Pinging effect for attention */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-25" />
          
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 24 24" 
            fill="currentColor" 
            className="w-8 h-8 relative z-10"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.414 0 0 5.414 0 12.05c0 2.123.552 4.197 1.602 6.02L0 24l6.149-1.613a11.815 11.815 0 005.901 1.564c6.63 0 12.05-5.414 12.05-12.05a11.83 11.83 0 00-3.54-8.509z"/>
          </svg>
        </a>
      </div>
    </div>
  );
}
