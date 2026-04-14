
'use client';

import Link from 'next/link';
import { Building2, ArrowLeft, Shield, AlertTriangle, FileText, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function TermsAndConditionsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-[100] bg-white/95 backdrop-blur-md border-b border-gray-100 h-16 flex items-center shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
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
      </nav>

      <div className="max-w-4xl mx-auto px-4 pt-32 pb-24">
        {/* Header */}
        <div className="bg-slate-900 rounded-[40px] p-12 text-center text-white mb-16 relative overflow-hidden">
          <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tighter italic uppercase underline decoration-[#00b4d8]">Términos de Servicio</h1>
          <p className="text-slate-500 font-black uppercase tracking-widest text-xs">Válido para todos los Tenants de Aurum Capital Holding</p>
        </div>

        {/* Content */}
        <div className="space-y-16 prose prose-slate prose-lg max-w-none">
          <section>
            <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-blue-50 text-[#003d7a] rounded-2xl"><FileText /></div>
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight m-0 italic">1. Relación Contractual</h2>
            </div>
            <p className="text-slate-600 font-medium">
              Al utilizar <strong>EscalaFin</strong> (la "Plataforma"), usted acepta estar obligado por estos Términos y Condiciones. El acceso a la Plataforma se otorga a través de una suscripción de Software como Servicio (SaaS) y NO implica una asociación legal, societaria, ni una responsabilidad compartida sobre las operaciones financieras del usuario (el "Tenant").
            </p>
          </section>

          <section className="bg-red-50 p-10 rounded-[40px] border-2 border-red-100 shadow-2xl shadow-red-900/5">
             <div className="flex items-center gap-4 mb-8">
              <div className="p-3 bg-red-100 text-red-600 rounded-2xl"><AlertTriangle /></div>
              <h2 className="text-3xl font-black text-red-900 uppercase tracking-tight m-0 italic decoration-red-600 underline">2. LIMITACIÓN DE RESPONSABILIDAD</h2>
            </div>
            <div className="space-y-6 text-red-800 font-bold leading-relaxed">
               <p className="p-4 bg-white rounded-2xl border border-red-100 italic">
                  <strong>A. PROVEEDOR TECNOLÓGICO ÚNICAMENTE:</strong> Aurum Capital Holding declara que opera únicamente como un proveedor de servicios tecnológicos. NI AURUM CAPITAL NI ESCALAFIN PROPORCIONAN SERVICIOS FINANCIEROS, INTERMEDIACIÓN, ASESORÍA DE INVERSIÓN O CRÉDITO.
               </p>
               <p className="p-4 bg-white rounded-2xl border border-red-100 italic">
                  <strong>B. RESPONSABILIDAD DE OPERACIONES:</strong> El Tenant (Usuario de Negocio) es el único y exclusivo responsable de la autorización, cobranza, aplicación de penalizaciones y legalidad de cada crédito otorgado a través de la Plataforma.
               </p>
               <p className="p-4 bg-white rounded-2xl border border-red-100 italic">
                  <strong>C. EXTRACCIÓN DE RESPONSABILIDAD:</strong> Aurum Capital Holding y EscalaFin no serán responsables por pérdidas, daños indirectos, incidentales, robos de identidad por negligencia del Tenant, o decisiones financieras tomadas basadas en los reportes del sistema.
               </p>
               <p className="p-4 bg-white rounded-2xl border border-red-100 italic font-black uppercase text-center text-red-900 underline">
                  AURUM CAPITAL HOLDING Y ESCALAFIN QUEDAN LIBERADOS DE CUALQUIER RESPONSABILIDAD LEGAL (PENAL, CIVIL, MERCANTIL O LABORAL) DERIVADA DE LA RELACIÓN ENTRE EL TENANT Y SUS CLIENTES FINALES.
               </p>
            </div>
          </section>

          <section>
            <div className="flex items-center gap-4 mb-8 text-[#003d7a]">
              <div className="p-3 bg-blue-50 text-[#003d7a] rounded-2xl"><Shield /></div>
              <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight m-0 italic">3. Uso Aceptable</h2>
            </div>
            <p className="text-slate-600 font-medium">
              El Tenant se compromete a NO utilizar la Plataforma para:
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4 list-none pl-0">
               {[
                 "Actividades de lavado de dinero o financiamiento al terrorismo.",
                 "Cobranza extrajudicial agresiva o ilegal.",
                 "Usura fuera de los marcos legales vigentes.",
                 "Distribución de datos personales sin consentimiento.",
                 "Suplantar o difamar a instituciones financieras."
               ].map((item, i) => (
                 <li key={i} className="flex gap-4 p-4 border border-slate-100 rounded-2xl bg-slate-50 font-bold text-slate-600">
                    <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />
                    {item}
                 </li>
               ))}
            </ul>
          </section>

          <section className="bg-[#003d7a] p-12 rounded-[50px] text-center text-white space-y-8 shadow-2xl shadow-blue-900/40">
            <div className="space-y-4">
              <h3 className="text-3xl font-black italic underline decoration-[#00b4d8]">JURISDICCIÓN</h3>
              <p className="text-blue-100/60 font-bold leading-relaxed max-w-2xl mx-auto">
                Cualquier controversia relacionada con estos términos se resolverá exclusivamente en los tribunales competentes de la ciudad de <strong>Querétaro, Querétaro, México</strong>, renunciando el usuario a cualquier otro fuero que pudiera corresponderle.
              </p>
            </div>
            <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-center gap-8">
               <div className="flex flex-col items-center gap-2">
                 <p className="text-[10px] font-black uppercase tracking-widest text-[#00b4d8]">FIRMADO ELECTRÓNICAMENTE POR</p>
                 <p className="text-xl font-black">UNIDAD LEGAL AURUM CAPITAL</p>
               </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
