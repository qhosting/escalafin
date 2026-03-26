'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Navigation, 
  User, 
  Calendar, 
  MapPin, 
  MessageSquare, 
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Home,
  Lock,
  MessageCircle,
  ArrowRight,
  TrendingUp,
  CreditCard
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// Helper to format outcome
const getOutcomeDetails = (outcome: string) => {
  switch (outcome) {
    case 'NOT_FOUND': return { label: 'Extraviado', icon: Home, color: 'bg-gray-100 text-gray-700', border: 'border-l-gray-400' };
    case 'NO_MONEY': return { label: 'Insolvente', icon: AlertTriangle, color: 'bg-red-100 text-red-700', border: 'border-l-red-500' };
    case 'WILL_PAY_LATER': return { label: 'Promesa', icon: Calendar, color: 'bg-blue-100 text-blue-700', border: 'border-l-blue-500' };
    case 'REFUSED_TO_PAY': return { label: 'Negativa', icon: XCircle, color: 'bg-purple-100 text-purple-700', border: 'border-l-purple-600' };
    case 'HOUSE_CLOSED': return { label: 'Cerrado', icon: Lock, color: 'bg-orange-100 text-orange-700', border: 'border-l-orange-500' };
    default: return { label: outcome, icon: MessageCircle, color: 'bg-slate-100 text-slate-700', border: 'border-l-slate-400' };
  }
};

export default function NonPaymentsPage() {
  const { data: session } = useSession();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, today: 0, promises: 0 });

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/visits');
      if (!response.ok) throw new Error('Error fetching visits');
      const data = await response.json();
      setVisits(data.visits);
      
      // Calculate simple stats
      const todayStr = new Date().toISOString().split('T')[0];
      setStats({
        total: data.pagination.totalCount,
        today: data.visits.filter((v: any) => v.visitDate.startsWith(todayStr)).length,
        promises: data.visits.filter((v: any) => v.promiseDate).length
      });
    } catch (error) {
      console.error(error);
      toast.error('No se pudieron cargar las incidencias');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, []);

  if (loading && visits.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <RefreshCw className="h-10 w-10 text-primary animate-spin" />
        <p className="font-black text-gray-400 uppercase tracking-widest text-xs">Cargando bitácora de campo...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in duration-700">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
             <div className="bg-red-600 p-2 rounded-xl text-white">
                <Navigation className="h-5 w-5" />
             </div>
             <Badge className="bg-red-50 text-red-700 border-red-100 font-black uppercase tracking-widest text-[10px]">Incidencias de Cobro</Badge>
          </div>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight leading-none mb-2">Gestión de No Pagos</h1>
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
             <Calendar className="h-3 w-3" /> Bitácora acumulada de visitas sin recaudación
          </p>
        </div>

        <Button 
          onClick={fetchVisits}
          className="h-14 lg:w-48 rounded-[1.5rem] bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-800 text-gray-900 dark:text-white font-black hover:bg-gray-50 uppercase tracking-widest text-xs gap-3 shadow-xl shadow-gray-200/50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          Sincronizar
        </Button>
      </div>

      {/* Stats Quick Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="rounded-[2rem] border-0 bg-blue-600 text-white shadow-2xl shadow-blue-500/20 overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Navigation className="h-40 w-40 rotate-12" />
              </div>
              <CardContent className="p-8">
                  <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Total Incidencias</p>
                  <h3 className="text-5xl font-black">{stats.total}</h3>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                      <TrendingUp className="h-3 w-3" /> Histórico Acumulado
                  </div>
              </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 bg-orange-500 text-white shadow-2xl shadow-orange-500/20 overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Calendar className="h-40 w-40" />
              </div>
              <CardContent className="p-8">
                  <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Registradas Hoy</p>
                  <h3 className="text-5xl font-black">{stats.today}</h3>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                      <ArrowRight className="h-3 w-3" /> Visitas del {format(new Date(), 'dd/MMM', { locale: es })}
                  </div>
              </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-0 bg-emerald-500 text-white shadow-2xl shadow-emerald-500/20 overflow-hidden relative">
              <div className="absolute -right-4 -bottom-4 opacity-10">
                  <CheckCircle2 className="h-40 w-40" />
              </div>
              <CardContent className="p-8">
                  <p className="text-xs font-black uppercase tracking-widest opacity-80 mb-1">Promesas de Pago</p>
                  <h3 className="text-5xl font-black">{stats.promises}</h3>
                  <div className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-md">
                      <CreditCard className="h-3 w-3" /> Seguimiento Activo
                  </div>
              </CardContent>
          </Card>
      </div>

      {/* Listado de Incidencias */}
      <div className="grid grid-cols-1 gap-4">
          {visits.map((visit) => {
              const details = getOutcomeDetails(visit.outcome);
              const OutcomeIcon = details.icon;

              return (
                <Card key={visit.id} className={cn(
                    "rounded-[2rem] border-2 border-gray-50 dark:border-gray-900 border-l-[6px] hover:shadow-2xl hover:scale-[1.01] transition-all bg-white dark:bg-gray-950 shadow-sm",
                    details.border
                )}>
                    <CardContent className="p-6 md:p-8">
                        <div className="flex flex-col md:flex-row justify-between gap-8">
                            <div className="flex-1 space-y-4">
                                <div className="flex items-center gap-4">
                                     <div className="w-14 h-14 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-center text-primary shadow-sm">
                                        <User className="h-7 w-7 opacity-80" />
                                     </div>
                                     <div>
                                        <Link href={`/${session?.user?.role.toLowerCase()}/clients/${visit.client?.id}`} className="hover:underline">
                                           <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-none mb-1">
                                              {visit.client?.firstName} {visit.client?.lastName}
                                           </h3>
                                        </Link>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                            {visit.loan?.loanNumber || 'SIN PRÉSTAMO'} · {visit.client?.phone}
                                        </p>
                                     </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-gray-50/50 dark:bg-gray-900/50 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-gray-400">Incidencia</Label>
                                        <Badge className={cn("flex w-fit items-center gap-1.5 px-3 py-1 rounded-full border-0 font-bold text-xs", details.color)}>
                                            <OutcomeIcon className="h-3 w-3" />
                                            {details.label}
                                        </Badge>
                                    </div>
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-gray-400">Fecha Visita</Label>
                                        <p className="text-sm font-bold text-gray-800 dark:text-gray-200">
                                          {format(new Date(visit.visitDate), "dd 'de' MMM, HH:mm", { locale: es })}
                                        </p>
                                    </div>
                                    {visit.promiseDate && (
                                        <div className="space-y-1">
                                            <Label className="text-[9px] font-black uppercase text-red-400">Promesa de Pago</Label>
                                            <p className="text-sm font-black text-red-600">
                                              {format(new Date(visit.promiseDate), "dd 'de' MMMM", { locale: es })}
                                            </p>
                                        </div>
                                    )}
                                    <div className="space-y-1">
                                        <Label className="text-[9px] font-black uppercase text-gray-400">Capturado por</Label>
                                        <p className="text-sm font-bold text-blue-600">
                                          {visit.advisor?.firstName} {visit.advisor?.lastName}
                                        </p>
                                    </div>
                                </div>

                                {visit.notes && (
                                    <div className="p-4 bg-gray-50 dark:bg-gray-900/30 rounded-2xl italic text-gray-600 dark:text-gray-400 text-sm border-l-4 border-gray-200">
                                        "{visit.notes}"
                                    </div>
                                )}
                            </div>

                            <div className="w-full md:w-64 space-y-3">
                                <Label className="text-[9px] font-black uppercase text-gray-400 px-1">Geo-Referencia</Label>
                                <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-[1.5rem] border border-gray-100 dark:border-gray-800">
                                    <div className="flex items-center gap-3 text-xs font-bold text-gray-500 mb-2">
                                        <MapPin className="h-4 w-4 text-red-500" />
                                        <span>GPS DATA</span>
                                    </div>
                                    <p className="font-mono text-[10px] text-gray-400 mb-4">{visit.latitude}, {visit.longitude}</p>
                                    <Button 
                                      variant="outline" 
                                      className="w-full h-11 rounded-xl bg-white dark:bg-gray-800 border-gray-200 font-bold text-xs uppercase tracking-widest shadow-sm hover:bg-gray-900 hover:text-white transition-all"
                                      onClick={() => window.open(`https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`, '_blank')}
                                    >
                                        Ver Mapa
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
              );
          })}

          {visits.length === 0 && (
              <div className="text-center py-20 bg-gray-50 rounded-[3rem] border border-dashed border-gray-200">
                  <Navigation className="h-16 w-16 text-gray-200 mx-auto mb-6" />
                  <h3 className="text-2xl font-black text-gray-300 uppercase tracking-tighter">Sin registros de campo</h3>
                  <p className="text-gray-400 font-bold mt-2">Todas las visitas han terminado en cobro exitoso.</p>
              </div>
          )}
      </div>
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode, className?: string }) {
    return <span className={cn("block text-xs font-medium text-gray-500 mb-1", className)}>{children}</span>;
}
