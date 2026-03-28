
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
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white border-b border-gray-100 h-20 flex items-center shadow-lg shadow-gray-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center">
            {/* Logo Group */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="bg-[#003d7a] p-2.5 rounded-2xl shadow-xl shadow-blue-900/10 transition-transform group-hover:scale-105">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col -space-y-1">
                <span className="text-xl font-black text-[#003d7a] tracking-tighter">EscalaFin</span>
                <span className="text-[10px] font-bold text-[#00b4d8] uppercase tracking-widest pl-0.5">Fintech SaaS</span>
              </div>
            </Link>

            {/* Navigation items */}
            <div className="flex items-center gap-4 sm:gap-8">
              <Link href="/auth/login" className="text-sm font-black text-slate-500 hover:text-[#003d7a] transition-colors uppercase tracking-widest px-2">
                Entrar
              </Link>
              <Link href="/auth/register-tenant">
                <Button className="bg-[#003d7a] hover:bg-[#002d5a] text-white font-black rounded-xl px-8 h-12 text-sm shadow-xl shadow-blue-900/40 transition-all hover:translate-y-[-2px] active:translate-y-0">
                  CREAR CUENTA
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero section ── */}
      <section className="relative pt-44 lg:pt-64 pb-24 overflow-hidden bg-slate-50/30">
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
      <a 
        href="https://wa.me/524424000742" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-[200] bg-[#25D366] text-white p-5 rounded-3xl shadow-2xl shadow-green-500/40 hover:scale-110 active:scale-95 transition-all animate-bounce-subtle group border-4 border-white"
      >
        <MessageSquare className="h-8 w-8 fill-white" />
        <span className="absolute right-full mr-6 top-1/2 -translate-y-1/2 bg-white text-[#003d7a] px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] opacity-0 group-hover:opacity-100 transition-all shadow-2xl border border-slate-100 pointer-events-none whitespace-nowrap translate-x-4 group-hover:translate-x-0">
           Hablemos por WhatsApp
        </span>
      </a>
    </div>
  );
}
