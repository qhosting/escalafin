
'use client';

import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Smartphone, 
  Calculator, 
  Bot, 
  ShieldCheck, 
  BarChart3, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  Play, 
  Users, 
  Briefcase, 
  Menu,
  X,
  ChevronRight,
  TrendingUp,
  CreditCard,
  Building,
  DollarSign,
  Calendar
} from 'lucide-react';

// Inyectamos la fuente Outfit
const FontStyles = () => (
  <style>
    {`
      @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&display=swap');
      body {
        font-family: 'Outfit', sans-serif;
      }
      .glass-card {
        background: rgba(255, 255, 255, 0.05);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      .glass-card-dark {
        background: rgba(15, 23, 42, 0.6);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.08);
      }
      input[type=range] {
        -webkit-appearance: none;
        width: 100%;
        background: transparent;
      }
      input[type=range]::-webkit-slider-thumb {
        -webkit-appearance: none;
        height: 20px;
        width: 20px;
        border-radius: 50%;
        background: #10b981; /* Emerald 500 */
        cursor: pointer;
        margin-top: -8px;
        box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
      }
      input[type=range]::-webkit-slider-runnable-track {
        width: 100%;
        height: 6px;
        cursor: pointer;
        background: #e2e8f0;
        border-radius: 9999px;
      }
      .dark-track::-webkit-slider-runnable-track {
        background: #334155;
      }
    `}
  </style>
);

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Estado del Simulador
  const [monto, setMonto] = useState(5000);
  const [tasa, setTasa] = useState(15);
  const [plazo, setPlazo] = useState(12);
  const [frecuencia, setFrecuencia] = useState('Semanal');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.role) {
      router.replace('/admin/dashboard');
    }
  }, [session, status, router]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!mounted) return null;

  // Lógica del simulador (Simplificada para demostración)
  const interesTotal = monto * (tasa / 100);
  const totalPagar = monto + interesTotal;
  const cuota = totalPagar / plazo;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 overflow-x-hidden">
      <FontStyles />

      {/* NAVBAR */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${isScrolled ? 'bg-white/90 backdrop-blur-md shadow-sm py-3' : 'bg-transparent py-5'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1e40af] flex items-center justify-center text-white font-bold text-xl">
                E
              </div>
              <span className={`font-bold text-2xl tracking-tight ${isScrolled ? 'text-[#1e40af]' : 'text-white'}`}>
                Escalafin
              </span>
            </Link>
            
            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#caracteristicas" className={`font-medium hover:text-emerald-500 transition-colors ${isScrolled ? 'text-slate-600' : 'text-slate-200'}`}>Características</a>
              <a href="#simulador" className={`font-medium hover:text-emerald-500 transition-colors ${isScrolled ? 'text-slate-600' : 'text-slate-200'}`}>Simulador</a>
              <a href="#beneficios" className={`font-medium hover:text-emerald-500 transition-colors ${isScrolled ? 'text-slate-600' : 'text-slate-200'}`}>Beneficios</a>
              <div className="flex items-center gap-4 ml-4">
                <Link href="/auth/login">
                  <button className={`font-medium ${isScrolled ? 'text-[#1e40af]' : 'text-white'} hover:text-emerald-400`}>
                    Acceso Personal
                  </button>
                </Link>
                <Link href="/auth/register-tenant">
                  <button className="bg-emerald-500 hover:bg-emerald-600 text-white px-5 py-2 rounded-full font-medium transition-all shadow-lg shadow-emerald-500/30">
                    Crear Cuenta
                  </button>
                </Link>
              </div>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden flex items-center">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className={`${isScrolled ? 'text-slate-800' : 'text-white'}`}>
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-full left-0 w-full bg-white shadow-xl py-4 px-4 flex flex-col gap-4 animate-in slide-in-from-top-4">
            <a href="#caracteristicas" className="text-slate-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Características</a>
            <a href="#simulador" className="text-slate-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Simulador</a>
            <a href="#beneficios" className="text-slate-600 font-medium" onClick={() => setMobileMenuOpen(false)}>Beneficios</a>
            <hr className="border-slate-100" />
            <Link href="/auth/login">
              <button className="text-[#1e40af] font-medium text-left w-full">Acceso Personal</button>
            </Link>
            <Link href="/auth/register-tenant">
              <button className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium text-center w-full">Crear Cuenta</button>
            </Link>
          </div>
        )}
      </nav>

      {/* HERO SECTION */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-[#1e40af]">
        {/* Background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
          <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] rounded-full bg-emerald-500/20 blur-[100px]"></div>
          <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-400/20 blur-[120px]"></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Text Content */}
            <div className="text-white max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-card text-emerald-300 text-sm font-medium mb-6">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                El Sistema Operativo para Microfinancieras Modernas
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6">
                Control total de tu cartera de microcréditos, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-300">en la palma de tu mano.</span>
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-8 opacity-90 leading-relaxed">
                Gestiona clientes, automatiza cobranzas y escala tu financiera con tecnología SaaS de última generación. Todo en una plataforma robusta, segura y multi-tenant.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register-tenant">
                  <button className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg shadow-emerald-500/40 flex items-center justify-center gap-2 group">
                    Comenzar Ahora
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
                <button className="glass-card hover:bg-white/10 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all flex items-center justify-center gap-2">
                  <Play size={20} className="fill-current" />
                  Ver Video Demo
                </button>
              </div>
            </div>

            {/* Dashboard Mockup (Glassmorphism) */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-full">
              <div className="glass-card rounded-2xl p-4 md:p-6 shadow-2xl relative z-10 border-t border-l border-white/20">
                {/* Mockup Header */}
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h3 className="text-white font-semibold">Dashboard General</h3>
                    <p className="text-blue-200 text-sm">Resumen en tiempo real</p>
                  </div>
                  <div className="bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-lg text-sm font-medium border border-emerald-500/30">
                    +12.5% vs Semanal
                  </div>
                </div>
                
                {/* Mockup KPI Cards */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-white/10 rounded-xl p-4 border border-white/5">
                    <p className="text-blue-200 text-xs mb-1">Cartera Activa</p>
                    <p className="text-white font-bold text-xl">$1.2M MXN</p>
                  </div>
                  <div className="bg-white/10 rounded-xl p-4 border border-white/5">
                    <p className="text-blue-200 text-xs mb-1">Tasa de Morosidad</p>
                    <p className="text-emerald-400 font-bold text-xl">4.2%</p>
                  </div>
                </div>

                {/* Mockup Chart Area */}
                <div className="bg-white/5 rounded-xl p-4 h-32 border border-white/5 flex items-end gap-2 justify-between">
                   {[40, 60, 45, 80, 55, 90, 75].map((h, i) => (
                     <div key={i} className="w-full bg-gradient-to-t from-emerald-500 to-cyan-400 rounded-t-sm opacity-80 hover:opacity-100 transition-opacity" style={{ height: `${h}%` }}></div>
                   ))}
                </div>

                {/* Floating Elements */}
                <div className="absolute -right-4 -bottom-4 md:-right-8 md:-bottom-8 bg-white rounded-xl p-4 shadow-xl animate-bounce" style={{ animationDuration: '3s' }}>
                  <div className="flex items-center gap-3">
                    <div className="bg-green-100 p-2 rounded-full">
                      <Bot className="text-green-600" size={20} />
                    </div>
                    <div>
                      <p className="text-slate-800 font-semibold text-sm">Notificación enviada</p>
                      <p className="text-slate-500 text-xs">WhatsApp • Hace 2 min</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF */}
      <section className="py-10 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-6">
            Confían en nosotros financieras de México y LATAM
          </p>
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
            <div className="flex items-center gap-2 text-xl font-bold font-serif"><Building size={24}/> CrediMax</div>
            <div className="flex items-center gap-2 text-xl font-black italic"><TrendingUp size={24}/> PrestaRapido</div>
            <div className="flex items-center gap-2 text-xl font-bold tracking-tighter"><CreditCard size={24}/> FinanzaPro</div>
            <div className="flex items-center gap-2 text-xl font-medium"><ShieldCheck size={24}/> SeguroCash</div>
          </div>
        </div>
      </section>

      {/* PROBLEMA VS SOLUCIÓN */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">¿Harto de Excel y falta de control?</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              El crecimiento de tu financiera no debería estar limitado por herramientas obsoletas o procesos manuales propensos a errores.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Problema */}
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                <span className="bg-red-100 text-red-600 p-2 rounded-lg"><XCircle size={24} /></span>
                La forma tradicional
              </h3>
              <ul className="space-y-4">
                {[
                  "Cálculos manuales en Excel propensos a errores.",
                  "Cobradores con recibos de papel y sin seguimiento GPS.",
                  "Falta de visibilidad de la morosidad en tiempo real.",
                  "Horas gastadas llamando a clientes para cobrar.",
                  "Riesgo de fraude por falta de validación de identidad."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-slate-600">
                    <X className="text-red-400 mt-1 shrink-0" size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Solución */}
            <div className="bg-[#1e40af] rounded-2xl p-8 shadow-xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 rounded-bl-full opacity-20"></div>
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2 relative z-10">
                <span className="bg-emerald-500 text-white p-2 rounded-lg"><CheckCircle2 size={24} /></span>
                Con Escalafin
              </h3>
              <ul className="space-y-4 relative z-10">
                {[
                  "Cálculos automáticos (Interés fijo, semanal, personalizado).",
                  "App Móvil con modo Offline y GPS para cobradores.",
                  "Dashboard en vivo con KPIs de tu cartera y asesores.",
                  "Recordatorios automatizados por WhatsApp.",
                  "Validación OCR de INE y Scoring Crediticio integrado."
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-3 text-blue-100">
                    <CheckCircle2 className="text-emerald-400 mt-1 shrink-0" size={18} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* INTERACTIVE CALCULATOR (EL GANCHO) */}
      <section id="simulador" className="py-20 bg-slate-900 text-white relative overflow-hidden">
        {/* Decoración */}
        <div className="absolute inset-0 opacity-10">
           <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-medium mb-6">
                <Calculator size={16} /> Motor de Cálculo Potente
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Prueba la potencia de nuestro motor de cálculo en vivo.
              </h2>
              <p className="text-slate-400 text-lg mb-8">
                Escalafin genera tablas de amortización dinámicas al instante. Soporta interés tradicional, tarifas fijas, esquemas semanales y sistemas personalizados.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                  <span>Amortización dinámica en tiempo real.</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                  <span>Refinanciamiento con un clic integrado.</span>
                </div>
                <div className="flex items-center gap-3 text-slate-300">
                  <CheckCircle2 className="text-emerald-500" size={20} />
                  <span>Generación de PDF automático para el cliente.</span>
                </div>
              </div>
            </div>

            {/* Simulador Interactivo UI */}
            <div className="glass-card-dark rounded-2xl p-6 md:p-8 shadow-2xl">
              <h3 className="text-xl font-bold mb-6 border-b border-slate-700 pb-4">Simulador de Préstamo</h3>
              
              <div className="space-y-6">
                {/* Monto */}
                <div>
                  <div className="flex justify-between mb-2">
                    <label className="text-slate-300 text-sm font-medium">Monto del Crédito</label>
                    <span className="text-emerald-400 font-bold">${monto.toLocaleString()} MXN</span>
                  </div>
                  <input 
                    type="range" 
                    className="dark-track"
                    min="1000" max="50000" step="500"
                    value={monto} 
                    onChange={(e) => setMonto(Number(e.target.value))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {/* Tasa */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-slate-300 text-sm font-medium">Tasa (%)</label>
                      <span className="text-emerald-400 font-bold">{tasa}%</span>
                    </div>
                    <input 
                      type="range" 
                      className="dark-track"
                      min="5" max="30" step="1"
                      value={tasa} 
                      onChange={(e) => setTasa(Number(e.target.value))}
                    />
                  </div>
                  
                  {/* Plazo */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <label className="text-slate-300 text-sm font-medium">Plazo</label>
                      <span className="text-emerald-400 font-bold">{plazo} {frecuencia.toLowerCase()}s</span>
                    </div>
                    <input 
                      type="range" 
                      className="dark-track"
                      min="4" max="52" step="1"
                      value={plazo} 
                      onChange={(e) => setPlazo(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Frecuencia */}
                <div>
                  <label className="text-slate-300 text-sm font-medium block mb-3">Frecuencia de Pago</label>
                  <div className="flex bg-slate-800 rounded-lg p-1">
                    {['Semanal', 'Quincenal', 'Mensual'].map((f) => (
                      <button
                        key={f}
                        className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${frecuencia === f ? 'bg-[#1e40af] text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        onClick={() => setFrecuencia(f)}
                      >
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resultados */}
                <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 mt-8">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-slate-400 text-sm">Cuota {frecuencia}</span>
                    <span className="text-3xl font-bold text-white">${cuota.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-slate-700 pt-3">
                    <span className="text-slate-400">Total a Pagar</span>
                    <span className="font-semibold text-emerald-400">${totalPagar.toLocaleString('es-MX', {minimumFractionDigits: 2, maximumFractionDigits: 2})}</span>
                  </div>
                </div>
                
                <Link href="/auth/register-tenant">
                  <button className="w-full bg-[#1e40af] hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors flex justify-center items-center gap-2 mt-4">
                    Probar ahora gratis <ArrowRight size={18}/>
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOS PILARES (FEATURES) */}
      <section id="caracteristicas" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Los 5 Pilares de Escalafin</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              Todo lo que necesitas para operar, agrupado en una sola plataforma robusta.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-blue-100 rounded-2xl flex items-center justify-center text-[#1e40af] mb-6 group-hover:bg-[#1e40af] group-hover:text-white transition-colors">
                <Calculator size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Gestión Integral de Cartera</h3>
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                Soporte para interés tradicional, tarifa fija y sistemas personalizados. Genera tablas de pago al instante y absorbe saldos en refinanciamientos con un clic.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 mb-6 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                <Smartphone size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Movilidad para Cobradores</h3>
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                App nativa diseñada para campo. Los asesores registran cobros, ven rutas y capturan firmas en tiempo real, incluso con modo offline.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Bot size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Automatización WhatsApp</h3>
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                Reduce la morosidad enviando automáticamente recordatorios a clientes próximos a vencer o con atrasos. Incluye WhatsApp Center integrado.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 group">
              <div className="w-14 h-14 bg-red-100 rounded-2xl flex items-center justify-center text-red-600 mb-6 group-hover:bg-red-500 group-hover:text-white transition-colors">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Seguridad y KYC</h3>
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                Extracción automática de datos de INE mediante IA (Google Vision) para prevenir fraudes. Scoring crediticio basado en historial.
              </p>
            </div>

            <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 hover:shadow-xl transition-all hover:-translate-y-1 group md:col-span-2 lg:col-span-1">
              <div className="w-14 h-14 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6 group-hover:bg-amber-500 group-hover:text-white transition-colors">
                <BarChart3 size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Inteligencia de Negocio</h3>
              <p className="text-slate-600 mb-4 text-sm leading-relaxed">
                KPIs en tiempo real: capital colocado, cartera vigente, tasa de morosidad y top deudores. Toma decisiones basadas en datos precisos.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* BENEFICIOS POR ROL */}
      <section id="beneficios" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Una solución para todo el equipo</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
              <div className="w-16 h-16 mx-auto bg-blue-50 rounded-full flex items-center justify-center text-[#1e40af] mb-4">
                <Briefcase size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Administrador</h3>
              <p className="text-slate-600 text-sm">
                Control absoluto del flujo de caja, reportes en tiempo real y asignación inteligente de carteras. Elimina las fugas de capital.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center relative md:-translate-y-4 shadow-lg border-[#1e40af]/20">
              <div className="w-16 h-16 mx-auto bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                <Smartphone size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Asesor / Cobrador</h3>
              <p className="text-slate-600 text-sm">
                Rutas optimizadas, app móvil intuitiva, menos errores manuales y comprobantes digitales instantáneos.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 text-center">
              <div className="w-16 h-16 mx-auto bg-purple-50 rounded-full flex items-center justify-center text-purple-600 mb-4">
                <Users size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Cliente Final</h3>
              <p className="text-slate-600 text-sm">
                Transparencia total. Claridad en sus pagos, recibos inmediatos vía WhatsApp y recordatorios oportunos para cuidar su historial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SAAS READY BANNER */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#1e40af]"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-[#1e40af] to-emerald-800 opacity-90"></div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10 text-white">
          <div className="inline-block bg-white/20 px-4 py-1.5 rounded-full text-sm font-semibold tracking-wider mb-6 backdrop-blur-sm border border-white/30 uppercase">
            Arquitectura Multi-Tenant SaaS
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-6">Lista para escalar contigo</h2>
          <p className="text-xl text-blue-100 mb-10 opacity-90">
            Crea tu organización y sucursales en segundos. Nuestra infraestructura en la nube garantiza que tu información esté siempre disponible, segura y respaldada.
          </p>
          <Link href="/auth/register-tenant">
            <button className="bg-white text-[#1e40af] hover:bg-slate-100 px-8 py-4 rounded-xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-2 mx-auto">
              Crear mi cuenta gratis <ArrowRight size={20} />
            </button>
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[#1e40af] flex items-center justify-center text-white font-bold text-xl">
                  E
                </div>
                <span className="font-bold text-2xl text-white tracking-tight">
                  Escalafin
                </span>
              </div>
              <p className="text-sm max-w-sm mb-6">
                El sistema operativo completo para microfinancieras modernas que buscan escalabilidad, control total y automatización.
              </p>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Producto</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#caracteristicas" className="hover:text-emerald-400 transition-colors">Características</a></li>
                <li><a href="#simulador" className="hover:text-emerald-400 transition-colors">Simulador</a></li>
                <li><a href="#" className="hover:text-emerald-400 transition-colors">Precios</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Compañía</h4>
              <ul className="space-y-2 text-sm">
                <li><Link href="/auth/login" className="hover:text-emerald-400 transition-colors">Acceso Personal</Link></li>
                <li><Link href="/auth/register-tenant" className="hover:text-emerald-400 transition-colors">Registro</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
            <p>&copy; {new Date().getFullYear()} Escalafin. Todos los derechos reservados.</p>
            <div className="flex space-x-6">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="hover:text-white transition-colors">Facebook</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
