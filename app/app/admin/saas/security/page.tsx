
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ShieldAlert, 
  MapPin, 
  Globe, 
  Clock, 
  Terminal, 
  AlertTriangle,
  RefreshCcw,
  Zap,
  Lock,
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageLoader } from '@/components/ui/page-loader';

export default function SecurityWAFPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/saas/security-logs');
      if (!res.ok) throw new Error('Error al cargar logs');
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading) return <PageLoader message="Cargando Command Center de Seguridad..." />;

  const stats = {
    totalBlocks: logs.length,
    last24h: logs.filter(l => new Date(l.timestamp).getTime() > Date.now() - 86400000).length,
    threatLevel: logs.length > 50 ? 'ALTO' : logs.length > 10 ? 'MEDIO' : 'BAJO'
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 p-2 lg:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl lg:text-6xl font-black text-gray-900 tracking-tighter flex items-center gap-4 uppercase italic">
            <div className="p-5 bg-black rounded-[2rem] shadow-2xl shadow-blue-500/20 ring-4 ring-gray-100">
               <ShieldAlert className="h-10 w-10 text-red-500 animate-pulse" />
            </div>
            Security & WAF
          </h1>
          <p className="text-gray-500 mt-4 font-bold text-xl lg:ml-24 max-w-2xl">
            Monitoreo en tiempo real de amenazas y ataques de inyección bloqueados por el firewall inteligente.
          </p>
        </div>
        <button 
           onClick={fetchLogs}
           className="bg-black hover:bg-gray-800 text-white font-black px-8 h-16 rounded-[1.5rem] tracking-widest text-xs flex items-center gap-3 transition-all hover:scale-105 active:scale-95 shadow-2xl"
        >
           <RefreshCcw className="h-5 w-5" /> REFRESCAR SISTEMA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-red-600 text-white overflow-hidden relative group">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
           <CardHeader>
              <Terminal className="h-6 w-6 mb-2 opacity-50" />
              <CardTitle className="text-5xl font-black tracking-tighter italic">{stats.totalBlocks}</CardTitle>
              <CardDescription className="text-red-100 font-bold uppercase tracking-widest text-[10px]">Amenazas Detectadas</CardDescription>
           </CardHeader>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl bg-orange-500 text-white overflow-hidden relative group">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
           <CardHeader>
              <Clock className="h-6 w-6 mb-2 opacity-50" />
              <CardTitle className="text-5xl font-black tracking-tighter italic">{stats.last24h}</CardTitle>
              <CardDescription className="text-orange-100 font-bold uppercase tracking-widest text-[10px]">Bloqueos Hoy</CardDescription>
           </CardHeader>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl bg-green-600 text-white overflow-hidden relative group">
           <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
           <CardHeader>
              <Zap className="h-6 w-6 mb-2 opacity-50" />
              <CardTitle className="text-5xl font-black tracking-tighter italic">{stats.threatLevel}</CardTitle>
              <CardDescription className="text-green-100 font-bold uppercase tracking-widest text-[10px]">Nivel de Riesgo Global</CardDescription>
           </CardHeader>
        </Card>
      </div>

      <Card className="rounded-[3.5rem] border-none shadow-2xl shadow-gray-200/50 ring-1 ring-gray-100 overflow-hidden bg-white">
        <CardHeader className="p-10 border-b border-gray-50 flex flex-row items-center justify-between">
           <div>
              <CardTitle className="text-2xl font-black tracking-tight uppercase">Log de Auditoría Forense</CardTitle>
              <CardDescription className="text-gray-400 font-bold">Historial detallado de todas las IPs bloqueadas por comportamiento malicioso.</CardDescription>
           </div>
           <Lock className="h-8 w-8 text-gray-100" />
        </CardHeader>
        <CardContent className="p-0">
          {logs.length > 0 ? (
            <div className="divide-y divide-gray-50">
              {logs.map((log) => {
                const details = log.details ? JSON.parse(log.details) : {};
                return (
                  <div key={log.id} className="p-8 hover:bg-red-50/30 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
                     <div className="flex items-start gap-6">
                        <div className="bg-gray-100 h-16 w-16 rounded-[1.5rem] flex items-center justify-center border-2 border-white shadow-sm transition-transform group-hover:scale-110 group-hover:-rotate-6">
                           <ShieldAlert className="h-8 w-8 text-red-600" />
                        </div>
                        <div className="space-y-1.5">
                           <div className="flex items-center gap-3">
                              <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter flex items-center gap-2">
                                 {log.ipAddress}
                                 <Badge className="bg-red-50 text-red-700 font-black text-[9px] uppercase tracking-widest border-red-100">BLOQUEADO</Badge>
                              </h4>
                           </div>
                           <div className="flex items-center gap-3 py-1">
                              <code className="text-[10px] font-black italic bg-gray-950 text-green-500 px-3 py-1 rounded-md">
                                 INTENTO: {details.blockedPath}
                              </code>
                              <code className="text-[10px] font-black bg-red-50 text-red-600 px-3 py-1 rounded-md">
                                 TIPO: {details.detectedPattern}
                              </code>
                           </div>
                           <div className="flex flex-wrap items-center gap-4 pt-2">
                              <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                                 <Smartphone className="h-3 w-3" /> {log.userAgent.substring(0, 30)}...
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[10px] uppercase tracking-widest">
                                 <Clock className="h-3 w-3" />
                                 {format(new Date(log.timestamp), "d MMM, HH:mm:ss", { locale: es })}
                              </div>
                           </div>
                        </div>
                     </div>
                     <div className="flex items-center gap-3">
                        <button className="h-14 w-14 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white hover:border-black transition-all shadow-sm">
                           <ExternalLink className="h-5 w-5" />
                        </button>
                     </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-32 text-center flex flex-col items-center gap-6">
               <div className="bg-green-50 p-8 rounded-full">
                  <Lock className="h-20 w-20 text-green-500" />
               </div>
               <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-sm">Sin amenazas detectadas. El firewall está operando correctamente.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
