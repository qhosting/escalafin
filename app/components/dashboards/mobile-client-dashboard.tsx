'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, DollarSign, ArrowRight, 
  Wallet, MessageCircle, Calendar,
  PieChart, History, PlusCircle
} from 'lucide-react';
import Link from 'next/link';

export function MobileClientDashboard() {
  const { data: session } = useSession();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/cliente/dashboard');
        if (response.ok) {
          const d = await response.json();
          setData(d);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const nextPayment = data?.activeLoans?.[0]?.nextPayment;

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Saludo */}
      <div className="px-2 space-y-1">
        <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Tu Resumen
        </h2>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
          Estado de tus créditos y pagos
        </p>
      </div>

      {/* Próximo Pago - Hero Card */}
      <div className="px-2">
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white shadow-xl shadow-blue-900/30 relative overflow-hidden">
          <div className="relative z-10 space-y-4">
            <div className="flex items-center gap-2 opacity-80">
              <Calendar size={14} className="stroke-[3px]" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Próximo Pago</span>
            </div>
            <div className="space-y-1">
              <h3 className="text-4xl font-black tracking-tight">
                {loading ? '...' : `$${(nextPayment?.amount || 0).toLocaleString('es-MX')}`}
              </h3>
              <p className="text-sm font-bold text-blue-100">
                Vence el {nextPayment?.date ? new Date(nextPayment.date).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' }) : 'N/A'}
              </p>
            </div>
            <Link href="/cliente/payments" className="inline-flex items-center gap-2 bg-white text-blue-700 px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-black/10 active:scale-95 transition-transform">
              PAGAR AHORA <ArrowRight size={14} />
            </Link>
          </div>
          <div className="absolute -bottom-12 -right-12 opacity-10">
            <Wallet size={200} />
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-3 gap-3 px-2">
        <QuickAction icon={PlusCircle} label="Nuevo Crédito" href="/cliente/credit-applications" color="bg-violet-600" />
        <QuickAction icon={History} label="Historial" href="/cliente/payments" color="bg-emerald-600" />
        <QuickAction icon={MessageCircle} label="Soporte" href="https://wa.me/yournumber" color="bg-green-600" />
      </div>

      {/* Mis Créditos Activos */}
      <div className="px-2 space-y-4">
        <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Mis Créditos</h3>
        <div className="space-y-3">
          {loading ? (
            <div className="h-24 bg-gray-100 animate-pulse rounded-3xl" />
          ) : data?.activeLoans?.map((loan: any, i: number) => (
            <Link key={i} href={`/cliente/loans/${loan.id}`}>
              <Card className="border-none bg-white dark:bg-gray-900 rounded-3xl shadow-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-50 text-blue-600 p-2.5 rounded-2xl">
                        <CreditCard size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-900 dark:text-white">Crédito #{loan.id.slice(-4)}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{loan.planName}</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 border-none rounded-lg text-[10px] font-black uppercase">
                      {loan.status}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Saldo Pendiente</p>
                      <p className="text-xl font-black text-gray-900 dark:text-white">${loan.remainingBalance.toLocaleString('es-MX')}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full border-2 border-gray-100 dark:border-gray-800 flex items-center justify-center">
                      <PieChart size={18} className="text-gray-300" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, href, color }: any) {
  return (
    <Link href={href} className="flex flex-col items-center gap-2 group">
      <div className={`w-full aspect-square ${color} rounded-[1.75rem] shadow-lg shadow-black/5 flex items-center justify-center text-white transition-transform active:scale-90`}>
        <Icon size={24} />
      </div>
      <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 text-center leading-tight px-1">
        {label}
      </span>
    </Link>
  );
}
