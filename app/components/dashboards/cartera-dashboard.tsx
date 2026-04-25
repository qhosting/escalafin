'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Phone,
  ArrowRight,
  Wallet,
  BarChart3,
  Clock,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

interface CarteraStats {
  resumen: {
    activeLoans: number;
    loansCompletados: number;
    loansMora: number;
    totalColocado: number;
    totalPendiente: number;
    tasaMorosidad: number;
  };
  flujoCaja: {
    cobradoHoy: number;
    esperadoEstaSemana: number;
    cobradoEstaSemana: number;
    eficienciaSemanal: number;
  };
  topDeudores: {
    loanId: string;
    loanNumber: string;
    clientName: string;
    phone: string;
    balanceRemaining: number;
    principalAmount: number;
  }[];
  proximosPagos: {
    scheduleId: string;
    loanId: string;
    loanNumber: string;
    clientName: string;
    phone: string;
    paymentDate: string;
    totalPayment: number;
  }[];
}

const fmt = (n: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export function CarteraDashboard() {
  const [data, setData] = useState<CarteraStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCartera = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/dashboard/cartera-stats');
      if (!res.ok) throw new Error('Error al cargar cartera');
      const json = await res.json();
      setData(json);
    } catch (e) {
      toast.error('No se pudo cargar la cartera');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCartera(); }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-32 rounded-3xl bg-gradient-to-r from-gray-100 to-gray-50 animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const { resumen, flujoCaja, topDeudores, proximosPagos } = data;
  const moraColor = resumen.tasaMorosidad > 15 ? 'text-red-600' : resumen.tasaMorosidad > 8 ? 'text-orange-500' : 'text-emerald-600';
  const eficienciaColor = flujoCaja.eficienciaSemanal >= 80 ? 'text-emerald-600' : flujoCaja.eficienciaSemanal >= 50 ? 'text-orange-500' : 'text-red-600';

  return (
    <div className="space-y-6">

      {/* ── Header ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2.5 rounded-2xl text-white shadow-lg">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Cartera en Tiempo Real</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Estado de la cartera activa</p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchCartera}
          className="text-gray-400 hover:text-gray-900"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* ── KPIs Principales ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Colocado */}
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-500/20 overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-10"><DollarSign className="h-28 w-28" /></div>
          <CardContent className="p-5">
            <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Capital Colocado</p>
            <p className="text-2xl font-black leading-none">{fmt(resumen.totalColocado)}</p>
            <p className="text-xs opacity-60 mt-2">Total histórico</p>
          </CardContent>
        </Card>

        {/* Cartera Vigente */}
        <Card className="rounded-3xl border-0 bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-xl shadow-emerald-500/20 overflow-hidden relative">
          <div className="absolute -right-4 -bottom-4 opacity-10"><Wallet className="h-28 w-28" /></div>
          <CardContent className="p-5">
            <p className="text-xs font-black uppercase tracking-widest opacity-70 mb-1">Cartera Vigente</p>
            <p className="text-2xl font-black leading-none">{fmt(resumen.totalPendiente)}</p>
            <p className="text-xs opacity-60 mt-2">{resumen.activeLoans} préstamos activos</p>
          </CardContent>
        </Card>

        {/* Morosidad */}
        <Card className="rounded-3xl border-0 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Tasa Morosidad</p>
            <p className={`text-2xl font-black leading-none ${moraColor}`}>{resumen.tasaMorosidad}%</p>
            <p className="text-xs text-gray-400 mt-2">{resumen.loansMora} en mora (&gt;7 días)</p>
          </CardContent>
        </Card>

        {/* Cobrado Hoy */}
        <Card className="rounded-3xl border-0 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <CardContent className="p-5">
            <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Cobrado Hoy</p>
            <p className="text-2xl font-black leading-none text-gray-900 dark:text-white">{fmt(flujoCaja.cobradoHoy)}</p>
            <p className="text-xs text-gray-400 mt-2">{format(new Date(), "EEEE d 'de' MMM", { locale: es })}</p>
          </CardContent>
        </Card>
      </div>

      {/* ── Flujo de Caja Semanal ─────────────────────────── */}
      <Card className="rounded-3xl border-0 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-sm">
        <CardHeader className="pb-2 pt-6 px-6">
          <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <BarChart3 className="h-4 w-4" /> Eficiencia de Cobranza — Semana Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <div className="flex items-end justify-between mb-3">
            <div>
              <p className={`text-4xl font-black ${eficienciaColor}`}>{flujoCaja.eficienciaSemanal}%</p>
              <p className="text-xs text-gray-400 mt-1">Cobrado vs Esperado</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{fmt(flujoCaja.cobradoEstaSemana)}</p>
              <p className="text-xs text-gray-400">cobrado</p>
              <p className="text-sm font-bold text-gray-500 mt-1">{fmt(flujoCaja.esperadoEstaSemana)}</p>
              <p className="text-xs text-gray-400">esperado</p>
            </div>
          </div>
          {/* Barra de progreso */}
          <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-700 ${
                flujoCaja.eficienciaSemanal >= 80 ? 'bg-emerald-500' :
                flujoCaja.eficienciaSemanal >= 50 ? 'bg-orange-400' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(flujoCaja.eficienciaSemanal, 100)}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* ── Grid: Top Deudores + Próximos Pagos ──────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Top Deudores */}
        <Card className="rounded-3xl border-0 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-sm">
          <CardHeader className="pb-2 pt-6 px-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500" /> Top Mayores Saldos
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {topDeudores.map((d, i) => (
              <div key={d.loanId} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-black ${
                    i === 0 ? 'bg-red-100 text-red-700' : i === 1 ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{d.clientName}</p>
                    <p className="text-xs text-gray-400">{d.loanNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-gray-900 dark:text-white">{fmt(d.balanceRemaining)}</p>
                  <a href={`tel:${d.phone}`} className="text-xs text-blue-500 hover:underline flex items-center gap-1 justify-end">
                    <Phone className="h-3 w-3" />{d.phone}
                  </a>
                </div>
              </div>
            ))}
            {topDeudores.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">Sin saldos pendientes</p>
            )}
          </CardContent>
        </Card>

        {/* Próximos Pagos */}
        <Card className="rounded-3xl border-0 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 shadow-sm">
          <CardHeader className="pb-2 pt-6 px-6">
            <CardTitle className="text-sm font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-500" /> Próximos Pagos (7 días)
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {proximosPagos.map((p) => (
              <div key={p.scheduleId} className="flex items-center justify-between p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                <div>
                  <p className="text-sm font-black text-gray-900 dark:text-white leading-none">{p.clientName}</p>
                  <p className="text-xs text-gray-400">{format(new Date(p.paymentDate), "EEEE d 'de' MMM", { locale: es })}</p>
                </div>
                <div className="text-right">
                  <Badge className="bg-blue-50 text-blue-700 border-0 font-black text-xs">
                    {fmt(p.totalPayment)}
                  </Badge>
                </div>
              </div>
            ))}
            {proximosPagos.length === 0 && (
              <p className="text-center text-gray-400 text-sm py-4">Sin pagos próximos</p>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
