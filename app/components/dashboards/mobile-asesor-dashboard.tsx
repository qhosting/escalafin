'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, CreditCard, Wallet, MapPin, 
  Search, CheckCircle2, AlertCircle, Clock,
  Navigation, Phone, MessageCircle, ChevronRight, UserPlus
} from 'lucide-react';
import Link from 'next/link';

export function MobileAsesorDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsRes, visitsRes] = await Promise.all([
          fetch('/api/asesor/stats'),
          fetch('/api/asesor/daily-visits')
        ]);
        
        if (statsRes.ok) setStats(await statsRes.json());
        if (visitsRes.ok) setVisits(await visitsRes.json());
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="flex flex-col gap-6 pb-24 animate-in fade-in duration-500">
      {/* Resumen de Cobranza en Campo */}
      <div className="px-2">
        <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex justify-between items-center">
              <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest">
                En Turno: {new Date().toLocaleDateString('es-MX', { weekday: 'long' })}
              </Badge>
              <div className="flex -space-x-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-7 h-7 rounded-full border-2 border-slate-900 bg-slate-800 flex items-center justify-center text-[10px] font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Meta del Día</p>
                <p className="text-2xl font-black">${(stats?.dailyTarget || 0).toLocaleString('es-MX')}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Recaudado</p>
                <p className="text-2xl font-black text-emerald-400">${(stats?.dailyCollected || 0).toLocaleString('es-MX')}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                <span>Progreso de Ruta</span>
                <span>{stats?.progress || 0}%</span>
              </div>
              <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-1000" 
                  style={{ width: `${stats?.progress || 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Botones de Acción Rápida */}
      <div className="grid grid-cols-3 gap-2 px-2">
        <Link href="/admin/payments" className="bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2 active:scale-95 transition-transform text-center">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-xl">
            <Wallet size={18} />
          </div>
          <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">Cobrar</span>
        </Link>
        <Link href="/asesor/clients" className="bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2 active:scale-95 transition-transform text-center">
          <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
            <Users size={18} />
          </div>
          <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">Clientes</span>
        </Link>
        <Link href="/admin/clients/new" className="bg-white dark:bg-gray-900 p-3 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-2 active:scale-95 transition-transform text-center">
          <div className="bg-orange-100 text-orange-600 p-2 rounded-xl">
            <UserPlus size={18} />
          </div>
          <span className="text-[10px] font-black text-gray-900 dark:text-white uppercase tracking-tighter leading-tight">Nuevo</span>
        </Link>
      </div>

      {/* Ruta de Visitas - Lista de Campo */}
      <div className="px-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Ruta de Hoy ({visits.length})</h3>
          <button className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
             <MapPin size={16} className="text-gray-600" />
          </button>
        </div>

        <div className="space-y-3">
          {loading ? (
             [1, 2, 3].map(i => <div key={i} className="h-28 bg-gray-100 animate-pulse rounded-3xl" />)
          ) : visits.length === 0 ? (
            <div className="text-center py-10 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
               <CheckCircle2 size={40} className="mx-auto text-gray-300 mb-2" />
               <p className="text-xs font-bold text-gray-400 uppercase">Sin visitas pendientes</p>
            </div>
          ) : (
            visits.map((visit, i) => (
              <Card key={i} className="border-none bg-white dark:bg-gray-900 rounded-3xl shadow-sm overflow-hidden group">
                <CardContent className="p-0">
                  <div className="p-5 flex items-start gap-4">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500">
                        {visit.clientName.charAt(0)}
                      </div>
                      {visit.isOverdue && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center">
                          <AlertCircle size={10} className="text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="text-sm font-black text-gray-900 dark:text-white truncate pr-2">
                          {visit.clientName}
                        </h4>
                        <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg">
                           ${visit.amountToCollect.toLocaleString('es-MX')}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase flex items-center gap-1">
                        <MapPin size={10} /> {visit.address}
                      </p>
                      <div className="flex items-center gap-3 pt-2">
                         <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400">
                            <Clock size={10} /> {visit.scheduledTime || '9:00 AM'}
                         </div>
                         <div className="flex items-center gap-1 text-[10px] font-bold text-blue-500">
                            <Navigation size={10} /> {visit.distance || '1.2 km'}
                         </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Bar for Field Agent */}
                  <div className="flex border-t border-gray-50 dark:border-gray-800">
                    <button className="flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-gray-600 border-r border-gray-50 dark:border-gray-800 hover:bg-gray-50">
                       <Phone size={14} /> Llamar
                    </button>
                    <button className="flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase text-green-600 border-r border-gray-50 dark:border-gray-800 hover:bg-green-50">
                       <MessageCircle size={14} /> WhatsApp
                    </button>
                    <Link href={`/admin/payments?clientId=${visit.clientId}`} className="flex-1 py-3 flex items-center justify-center gap-2 text-[10px] font-black uppercase bg-blue-600 text-white hover:bg-blue-700">
                       Visitar <ChevronRight size={14} />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Botón Flotante de Escaneo / Nuevo Cliente */}
      <div className="fixed bottom-24 right-6 z-50">
        <button className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl shadow-xl shadow-blue-900/40 flex items-center justify-center text-white active:scale-90 transition-transform">
          <Search size={24} />
        </button>
      </div>
    </div>
  );
}
