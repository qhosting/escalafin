'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, Users, DollarSign, TrendingUp, 
  ArrowRight, Activity, Bell, Plus, 
  Search, Wallet, MessageSquare, UserPlus
} from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { ModuleWrapper } from '@/components/ui/module-wrapper';

export function MobileAdminDashboard() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/admin-stats');
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const quickActions = [
    { icon: Plus, label: 'Nuevo Crédito', href: '/admin/loans/new', color: 'bg-blue-600' },
    { icon: Users, label: 'Clientes', href: '/admin/clients', color: 'bg-indigo-600' },
    { icon: Wallet, label: 'Cobrar', href: '/admin/payments', color: 'bg-emerald-600' },
    { icon: UserPlus, label: 'Nuevo Cliente', href: '/admin/clients/new', color: 'bg-orange-500' },
  ];

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Saludo y Notificaciones */}
      <div className="flex items-center justify-between px-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            ¡Hola, {session?.user?.name?.split(' ')[0] || 'Admin'}!
          </h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">
            {new Date().toLocaleDateString('es-MX', { month: 'long', day: 'numeric' })}
          </p>
        </div>
        <button className="relative p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
          <Bell className="h-6 w-6 text-gray-600 dark:text-gray-400" />
          <span className="absolute top-2 right-2 w-3 h-3 bg-red-500 border-2 border-white dark:border-gray-900 rounded-full" />
        </button>
      </div>

      {/* Stats - Horizontal Scroll */}
      <div className="flex gap-4 overflow-x-auto pb-4 px-2 no-scrollbar -mx-2">
        <div className="flex gap-4 px-2">
          <StatCard 
            title="Préstamos" 
            value={loading ? '...' : stats?.activeLoans} 
            icon={CreditCard} 
            color="text-blue-600" 
            bgColor="bg-blue-50"
          />
          <StatCard 
            title="Cartera" 
            value={loading ? '...' : `$${(stats?.totalPortfolio || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`} 
            icon={TrendingUp} 
            color="text-purple-600" 
            bgColor="bg-purple-50"
          />
          <StatCard 
            title="Cobros Hoy" 
            value={loading ? '...' : `$${(stats?.paymentsThisMonth || 0).toLocaleString('es-MX', { maximumFractionDigits: 0 })}`} 
            icon={DollarSign} 
            color="text-emerald-600" 
            bgColor="bg-emerald-50"
          />
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="grid grid-cols-4 gap-3 px-2">
        {quickActions.map((action, i) => (
          <Link key={i} href={action.href} className="flex flex-col items-center gap-2 group">
            <div className={`w-14 h-14 ${action.color} rounded-[1.25rem] shadow-lg shadow-black/5 flex items-center justify-center text-white transition-transform active:scale-90`}>
              <action.icon size={24} />
            </div>
            <span className="text-[10px] font-black uppercase text-gray-600 dark:text-gray-400 text-center leading-tight">
              {action.label}
            </span>
          </Link>
        ))}
      </div>

      {/* Actividad Reciente - Mobile Version */}
      <div className="px-2 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Actividad</h3>
          <Link href="/admin/audit" className="text-xs font-bold text-blue-600">Ver Todo</Link>
        </div>
        
        <div className="space-y-3">
          {stats?.recentActivities?.slice(0, 5).map((activity: any, i: number) => (
            <Card key={i} className="border-none bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm rounded-2xl">
              <CardContent className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${
                  activity.status === 'success' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  <Activity size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{activity.action}</p>
                  <p className="text-xs text-gray-500 truncate">{activity.details}</p>
                </div>
                <span className="text-[10px] font-medium text-gray-400 whitespace-nowrap">
                  {formatDistanceToNow(new Date(activity.time), { addSuffix: true, locale: es })}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Banner de Operación Especial */}
      <div className="px-2">
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-3xl p-6 text-white relative overflow-hidden shadow-xl shadow-blue-900/20">
          <div className="relative z-10 space-y-2">
            <h4 className="text-lg font-black tracking-tight">Balance de Cartera</h4>
            <p className="text-white/70 text-xs font-medium leading-relaxed">
              Tu cartera ha crecido un <span className="text-white font-bold">+12%</span> esta semana. Revisa los reportes detallados.
            </p>
            <Button className="mt-2 bg-white text-blue-700 hover:bg-white/90 rounded-xl font-black text-xs h-9" asChild>
              <Link href="/admin/reports">Explorar KPIs</Link>
            </Button>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <TrendingUp size={120} />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, bgColor }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm min-w-[160px] flex flex-col gap-3">
      <div className={`${bgColor} ${color} p-2.5 rounded-2xl self-start`}>
        <Icon size={20} />
      </div>
      <div className="space-y-0.5">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{title}</p>
        <p className="text-xl font-black text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

function Button({ children, className, asChild }: any) {
  const Comp = asChild ? 'div' : 'button';
  return <Comp className={className}>{children}</Comp>;
}
