'use client';

import { Smartphone, Download, AlertCircle, Apple, LayoutGrid, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#080a0f] text-white p-6 flex flex-col items-center justify-center relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[100%] h-[100%] bg-blue-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[100%] h-[100%] bg-indigo-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 w-full max-w-[450px] space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-[2rem] bg-gradient-to-br from-blue-600 to-indigo-700 shadow-2xl shadow-blue-900/40 mb-4 animate-bounce">
            <Smartphone size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-black tracking-tight">EscalaFin Mobile</h1>
          <p className="text-slate-400 font-medium">Lleva tu gestión financiera a todas partes</p>
        </div>

        <div className="space-y-4">
          {/* Android Card */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-[2.5rem] overflow-hidden hover:bg-white/10 transition-all group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black">Android</h2>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[10px] font-black uppercase">Disponible</Badge>
                  </div>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Versión Nativa v2.8.5</p>
                </div>
                <div className="w-14 h-14 bg-emerald-500/20 rounded-2xl flex items-center justify-center text-emerald-500">
                  <LayoutGrid size={28} />
                </div>
              </div>
              
              <a 
                href="/app-debug.apk" 
                download="EscalaFin_v2.8.5.apk"
                className="flex items-center justify-center gap-3 w-full py-5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl font-black text-sm shadow-xl shadow-emerald-900/20 transition-all active:scale-95"
              >
                <Download size={20} /> DESCARGAR APK DIRECTO
              </a>
              <p className="text-[10px] text-center mt-4 text-slate-500 font-medium">
                * Requiere habilitar "Instalar apps de fuentes desconocidas"
              </p>
            </CardContent>
          </Card>

          {/* iOS Card */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl rounded-[2.5rem] opacity-70 group">
            <CardContent className="p-8">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h2 className="text-2xl font-black text-slate-300">iOS (iPhone)</h2>
                    <Badge className="bg-amber-500/20 text-amber-400 border-none text-[10px] font-black uppercase">En Construcción</Badge>
                  </div>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Próximamente en TestFlight</p>
                </div>
                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400">
                  <Apple size={28} />
                </div>
              </div>
              
              <div className="flex items-center gap-3 w-full py-5 bg-slate-800 text-slate-500 rounded-2xl font-black text-sm justify-center cursor-not-allowed">
                <AlertCircle size={20} /> NO DISPONIBLE AÚN
              </div>
              <p className="text-[10px] text-center mt-4 text-slate-600 font-medium italic">
                Para iOS, te recomendamos usar la versión PWA (Añadir a pantalla de inicio).
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="text-center pt-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-black text-slate-500 hover:text-white uppercase tracking-widest transition-colors">
            <ArrowLeft size={14} /> Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
