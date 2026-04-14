
'use client';

import Link from 'next/link';
import { Building2, ArrowLeft, Shield, Lock, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-slate-50/50">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-gray-100 h-16 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-[#003d7a] p-2 rounded-xl">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-black text-[#003d7a] tracking-tighter">EscalaFin</span>
            </Link>
            <Link href="/">
              <Button variant="ghost" className="text-sm font-bold text-slate-500 hover:text-[#003d7a]">
                <ArrowLeft className="h-4 w-4 mr-2" /> Volver al Inicio
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 pt-32 pb-24">
        {/* Header */}
        <div className="bg-[#003d7a] rounded-[40px] p-12 text-center text-white mb-12 shadow-2xl shadow-blue-900/20 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Shield size={120} />
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter">AVISO DE PRIVACIDAD</h1>
          <p className="text-blue-100/60 font-black uppercase tracking-widest text-xs">Última actualización: Abril 2025</p>
        </div>

        {/* Content */}
        <div className="bg-white rounded-[40px] p-8 md:p-16 shadow-xl shadow-slate-200/50 border border-slate-100 prose prose-slate prose-lg max-w-none">
          <section className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 text-[#003d7a] rounded-2xl"><Building2 /></div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight m-0">1. Identidad y Domicilio</h2>
            </div>
            <p className="text-slate-600 font-medium">
              <strong>Aurum Capital Holding</strong> y su plataforma <strong>EscalaFin</strong> (en lo sucesivo, "El Proveedor"), con domicilio para oír y recibir notificaciones en Querétaro, México, es responsable del tratamiento de sus datos personales. El Proveedor actúa exclusivamente como facilitador tecnológico a través del modelo Software as a Service (SaaS).
            </p>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 text-[#003d7a] rounded-2xl"><Eye /></div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight m-0">2. Datos que Recabamos</h2>
            </div>
            <p className="text-slate-600 font-medium">
              El Proveedor recaba dos tipos de información:
            </p>
            <ul className="text-slate-600 font-medium list-none pl-0 space-y-4">
               <li className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="p-2 bg-white rounded-xl shadow-sm h-fit"><Lock className="h-4 w-4 text-blue-600" /></div>
                  <div>
                    <strong>Datos del Tenant (Empresa):</strong> Nombre legal, contacto, datos de facturación y configuración del sistema.
                  </div>
               </li>
               <li className="flex gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="p-2 bg-white rounded-xl shadow-sm h-fit"><Users className="h-4 w-4 text-blue-600" /></div>
                  <div>
                    <strong>Datos de Clientes Finales:</strong> EscalaFin almacena información proporcionada por los Tenants sobre sus propios clientes. El Proveedor actúa como <strong>Encargado del Tratamiento</strong> de estos datos, bajo las instrucciones y responsabilidad exclusiva del Tenant.
                  </div>
               </li>
            </ul>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 text-[#003d7a] rounded-2xl"><Shield /></div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight m-0">3. DESCARGO DE RESPONSABILIDAD LEGAL</h2>
            </div>
            <div className="p-8 bg-red-50 border-2 border-red-100 rounded-[30px] space-y-4">
              <p className="text-red-900 font-black uppercase text-sm tracking-widest leading-none">IMPORTANTE:</p>
              <p className="text-red-700 font-bold leading-relaxed m-0">
                EscalaFin y Aurum Capital Holding NO son instituciones financieras, bancos, Sofomes, ni entidades de crédito. Somos UNICAMENTE proveedores de software. 
              </p>
              <p className="text-red-700 font-bold leading-relaxed m-0">
                Cada empresa (Tenant) que utiliza nuestra plataforma es legalmente independiente y responsable único de: 
                (a) La legalidad de sus operaciones crediticias, (b) El cumplimiento de leyes fiscales y de lavado de dinero, 
                (c) La obtención del consentimiento de privacidad de sus propios clientes, y (d) Sus prácticas de cobranza.
              </p>
              <p className="text-red-700 font-bold leading-relaxed m-0">
                Aurum Capital Holding y el sistema EscalaFin quedan liberados de cualquier responsabilidad legal, civil, penal o administrativa resultante de la operación financiera de los usuarios de la plataforma.
              </p>
            </div>
          </section>

          <section className="mb-12">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-blue-50 text-[#003d7a] rounded-2xl"><Lock /></div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight m-0">4. Seguridad</h2>
            </div>
            <p className="text-slate-600 font-medium">
              Implementamos medidas técnicas de última generación (encriptado HTTPS, bases de datos aisladas por Tenant, auditoría de logs) para proteger la información. Sin embargo, no garantizamos la invulnerabilidad total ante ataques cibernéticos externos.
            </p>
          </section>

          <section>
             <div className="p-8 bg-slate-900 rounded-3xl text-center text-white">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500 mb-2">Contacto de Privacidad</p>
                <p className="text-lg font-bold">legal@aurumcapital.mx</p>
             </div>
          </section>
        </div>
      </div>
    </div>
  );
}
