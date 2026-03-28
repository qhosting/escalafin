
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
  Smartphone,
  Unlock,
  History,
  Activity,
  Calendar
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { PageLoader } from '@/components/ui/page-loader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from 'sonner';

export default function SecurityWAFPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [bannedIps, setBannedIps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('threats');

  const fetchData = async () => {
    try {
      setLoading(true);
      // Carga de logs históricos de amenazas
      const resLogs = await fetch('/api/admin/saas/security-logs');
      if (resLogs.ok) {
        const data = await resLogs.json();
        setLogs(data.logs || []);
      }

      // Carga de baneos activos y recientes
      const resBans = await fetch('/api/admin/saas/security-bans');
      if (resBans.ok) {
        const data = await resBans.json();
        setBannedIps(data.bans || []);
      }
    } catch (e) {
      console.error(e);
      toast.error('Error sincronizando con el Command Center.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleUnban = async (ip: string) => {
    const confirmUnban = confirm(`¿Está seguro de desbloquear la IP ${ip}?`);
    if (!confirmUnban) return;

    try {
      const res = await fetch('/api/admin/saas/security-bans', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ ip })
      });

      if (res.ok) {
        toast.success(`IP ${ip} desbloqueada manualmente.`);
        fetchData();
      } else {
        throw new Error('No se pudo quitar el baneo.');
      }
    } catch (e: any) {
      toast.error(`Error: ${e.message}`);
    }
  };

  if (loading && logs.length === 0) return <PageLoader message="Abriendo sesión segura de monitoreo..." />;

  const stats = {
    totalBlocks: logs.length,
    activeBans: bannedIps.filter(b => b.isActive).length,
    threatLevel: logs.length > 50 ? 'ALTO' : logs.length > 10 ? 'MEDIO' : 'BAJO'
  };

  return (
    <div className="space-y-10 animate-in fade-in duration-700 pb-20 p-2 lg:p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl lg:text-5xl font-black text-gray-900 tracking-tighter flex items-center gap-4 uppercase italic">
            <div className="p-5 bg-black rounded-[2rem] shadow-2xl shadow-blue-500/20 ring-4 ring-gray-100">
               <ShieldAlert className="h-9 w-9 text-red-500 animate-pulse" />
            </div>
            Security command center
          </h1>
          <p className="text-gray-500 mt-4 font-bold text-lg lg:ml-24 max-w-2xl leading-relaxed italic border-l-4 border-red-600 pl-6">
             Monitoreo reactivo y defensa activa del ecosistema SaaS. <br />
             <span className="text-xs uppercase text-slate-400 font-black tracking-widest not-italic">Uptime protección: 100% Garantizado</span>
          </p>
        </div>
        <div className="flex gap-4">
           <button 
              onClick={fetchData}
              className="bg-gray-100 hover:bg-gray-200 text-slate-800 font-black px-8 h-16 rounded-[1.5rem] tracking-widest text-xs flex items-center gap-3 transition-all hover:scale-105 active:scale-95 border-b-4 border-gray-300"
           >
              <RefreshCcw className="h-5 w-5" /> REFRESCAR
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-[2.5rem] border-none shadow-xl bg-slate-950 text-white overflow-hidden relative group border-b-8 border-red-600">
           <div className="absolute -right-20 -top-20 w-60 h-60 bg-red-600/10 rounded-full blur-3xl" />
           <CardHeader>
              <Terminal className="h-6 w-6 mb-2 opacity-50" />
              <CardTitle className="text-6xl font-black tracking-tighter italic">{stats.totalBlocks}</CardTitle>
              <CardDescription className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Amenazas Detenidas</CardDescription>
           </CardHeader>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl bg-black text-white overflow-hidden relative group border-b-8 border-orange-500">
           <div className="absolute -right-20 -top-20 w-60 h-60 bg-orange-600/10 rounded-full blur-3xl" />
           <CardHeader>
              <Lock className="h-6 w-6 mb-2 opacity-50 text-orange-500" />
              <CardTitle className="text-6xl font-black tracking-tighter italic">{stats.activeBans}</CardTitle>
              <CardDescription className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Baneos Activos (Redis)</CardDescription>
           </CardHeader>
        </Card>

        <Card className="rounded-[2.5rem] border-none shadow-xl bg-gray-900 text-white overflow-hidden relative group border-b-8 border-green-600">
           <div className="absolute -right-20 -top-20 w-60 h-60 bg-green-600/10 rounded-full blur-3xl" />
           <CardHeader>
              <Zap className="h-6 w-6 mb-2 opacity-50 text-green-500" />
              <CardTitle className="text-5xl font-black tracking-tighter italic uppercase">{stats.threatLevel}</CardTitle>
              <CardDescription className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Nivel de Riesgo Global</CardDescription>
           </CardHeader>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
         <TabsList className="bg-gray-100 p-2 rounded-2xl h-20 w-full max-w-lg mb-8">
            <TabsTrigger value="threats" className="rounded-xl h-full font-black uppercase text-xs tracking-widest flex-1 data-[state=active]:bg-white data-[state=active]:shadow-lg data-[state=active]:text-red-600">
               <ShieldAlert className="h-4 w-4 mr-2" />
               Log Amenazas
            </TabsTrigger>
            <TabsTrigger value="bans" className="rounded-xl h-full font-black uppercase text-xs tracking-widest flex-1 data-[state=active]:bg-black data-[state=active]:shadow-lg data-[state=active]:text-white">
               <Lock className="h-4 w-4 mr-2" />
               IPs Baneadas
            </TabsTrigger>
         </TabsList>

         <TabsContent value="threats">
            <Card className="rounded-[3.5rem] border-none shadow-2xl shadow-gray-200/50 ring-1 ring-gray-100 overflow-hidden bg-white">
              <CardHeader className="p-10 border-b border-gray-50 flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="text-2xl font-black tracking-tight uppercase italic underline decoration-red-600 decoration-4 underline-offset-8">WAF Log Feed</CardTitle>
                    <CardDescription className="text-gray-400 font-bold mt-2">Detección de patrones de inyección y escaneo de vulnerabilidades.</CardDescription>
                 </div>
                 <History className="h-8 w-8 text-gray-200" />
              </CardHeader>
              <CardContent className="p-0">
                {logs.length > 0 ? (
                  <div className="divide-y divide-gray-50">
                    {logs.map((log) => {
                      const details = log.details ? JSON.parse(log.details) : {};
                      return (
                        <div key={log.id} className="p-8 hover:bg-gray-50/50 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
                           <div className="flex items-start gap-6">
                              <div className="bg-slate-900 h-16 w-16 rounded-[1.8rem] flex items-center justify-center border-2 border-white shadow-xl transition-transform group-hover:scale-110 group-hover:rotate-12">
                                 <AlertTriangle className="h-8 w-8 text-orange-500" />
                              </div>
                              <div className="space-y-1.5">
                                 <div className="flex items-center gap-3">
                                    <h4 className="text-xl font-black text-gray-900 uppercase tracking-tighter">
                                       {log.ipAddress}
                                    </h4>
                                    {details.isBannedNow && <Badge className="bg-black text-white font-black text-[9px] uppercase tracking-widest border-0">BANNED SYSTEM</Badge>}
                                 </div>
                                 <div className="flex flex-wrap items-center gap-3 py-1">
                                    <code className="text-[10px] font-black italic bg-gray-50 text-indigo-600 px-3 py-1.5 rounded-xl border border-indigo-50">
                                       PATH: {details.blockedPath}
                                    </code>
                                    <span className="text-[10px] font-bold text-slate-400">pattern: {details.detectedPattern}</span>
                                 </div>
                                 <div className="flex flex-wrap items-center gap-4 pt-2">
                                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[9px] uppercase tracking-widest">
                                       <Calendar className="h-3.5 w-3.5" />
                                       {format(new Date(log.timestamp), "d MMM, HH:mm:ss", { locale: es })}
                                    </div>
                                    <div className="flex items-center gap-1.5 text-gray-400 font-bold text-[9px] uppercase tracking-widest max-w-[300px] line-clamp-1">
                                       <Smartphone className="h-3.5 w-3.5" /> {log.userAgent}
                                    </div>
                                 </div>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <button className="h-12 w-12 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-300 hover:bg-white hover:text-black hover:shadow-xl transition-all">
                                 <ExternalLink className="h-4 w-4" />
                              </button>
                           </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-32 text-center flex flex-col items-center gap-6">
                     <div className="bg-green-50 p-8 rounded-full">
                        <Lock className="h-20 w-20 text-green-500 animate-pulse" />
                     </div>
                     <p className="text-gray-400 font-black uppercase tracking-[0.2em] text-xs">No se han detectado intentos de intrusión recientemente.</p>
                  </div>
                )}
              </CardContent>
            </Card>
         </TabsContent>

         <TabsContent value="bans">
            <Card className="rounded-[3.5rem] border-none shadow-2xl shadow-gray-200/50 ring-1 ring-gray-100 overflow-hidden bg-slate-950 text-white">
              <CardHeader className="p-10 border-b border-white/5 flex flex-row items-center justify-between bg-gradient-to-r from-red-600/10 to-transparent">
                 <div>
                    <CardTitle className="text-2xl font-black tracking-tight uppercase italic">Bancos de IP Restringidas</CardTitle>
                    <CardDescription className="text-slate-400 font-bold mt-2">IPs que han superado el umbral de 5 intentos y están bloqueadas para todo el sitio.</CardDescription>
                 </div>
                 <Activity className="h-8 w-8 text-orange-500 animate-pulse" />
              </CardHeader>
              <CardContent className="p-0">
                {bannedIps.filter(b => b.isActive).length > 0 ? (
                  <div className="divide-y divide-white/5">
                    {bannedIps.filter(b => b.isActive).map((ban) => (
                      <div key={ban.id} className="p-8 hover:bg-white/5 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 group">
                         <div className="flex items-start gap-6">
                            <div className="bg-red-600/20 h-16 w-16 rounded-[1.8rem] flex items-center justify-center border-2 border-red-600/30 group-hover:bg-red-600 group-hover:scale-110 transition-all duration-500">
                               <ShieldAlert className="h-8 w-8 text-red-500 group-hover:text-white" />
                            </div>
                            <div className="space-y-1.5">
                               <div className="flex items-center gap-3">
                                  <h4 className="text-2xl font-black text-white tracking-tighter">
                                     {ban.ip}
                                  </h4>
                                  <Badge className="bg-orange-500 text-black font-black text-[9px] uppercase tracking-widest border-0">24H BAN</Badge>
                               </div>
                               <p className="text-slate-500 font-bold text-xs uppercase tracking-tight">Motivo: {ban.details.reason || 'Umbral de intentos excedido'}</p>
                               <div className="flex items-center gap-6 pt-3">
                                  <div className="flex items-center gap-2 text-red-400 font-black text-[10px] uppercase tracking-widest">
                                     <Clock className="h-4 w-4" />
                                     TTL: {Math.floor(ban.ttl / 3600)}h {Math.floor((ban.ttl % 3600) / 60)}m restates
                                  </div>
                                  <div className="text-slate-600 font-black text-[10px] uppercase tracking-widest">
                                     Desde: {format(new Date(ban.bannedAt), "HH:mm:ss 'del' d MMM", { locale: es })}
                                  </div>
                               </div>
                            </div>
                         </div>
                         <button 
                            onClick={() => handleUnban(ban.ip)}
                            className="bg-white hover:bg-green-500 hover:text-white text-black font-black px-8 h-12 rounded-xl text-[10px] uppercase tracking-[0.2em] transition-all flex items-center gap-3 group/btn"
                         >
                            <Unlock className="h-4 w-4 group-hover/btn:rotate-12 transition-transform" /> DESBLOQUEAR IP
                         </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-40 text-center flex flex-col items-center gap-8">
                     <div className="bg-white/5 p-12 rounded-[3rem] border border-white/10">
                        <Globe className="h-20 w-20 text-slate-800" />
                     </div>
                     <div className="space-y-2">
                        <p className="text-white font-black uppercase tracking-[0.3em] text-sm">Prisión de IPs vacía</p>
                        <p className="text-slate-500 font-bold text-xs">No hay atacantes recurrentes bloqueados en este momento.</p>
                     </div>
                  </div>
                )}
              </CardContent>
            </Card>
         </TabsContent>
      </Tabs>
    </div>
  );
}
