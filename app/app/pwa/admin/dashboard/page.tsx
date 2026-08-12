'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  TrendingUp, Users, CreditCard, DollarSign,
  AlertTriangle, ArrowRight, RefreshCw, ChevronRight
} from 'lucide-react';
import { MobileDashboardSkeleton } from '@/components/ui/skeletons';
import Link from 'next/link';

const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', notation: 'compact', maximumFractionDigits: 1 }).format(n);

export default function PWAAdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [recentLoans, setRecentLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
    if (session?.user?.role && !['ADMIN', 'SUPER_ADMIN'].includes(session.user.role)) router.push('/pwa');
  }, [session, status, router]);

  useEffect(() => {
    if (session?.user) loadDashboard();
  }, [session]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [loansRes, paymentsRes] = await Promise.all([
        fetch('/api/loans?status=ACTIVE&limit=5'),
        fetch('/api/payments/cash?limit=1&dateFrom=' + new Date().toISOString().split('T')[0])
      ]);

      const loansData = await loansRes.json();
      const paymentsData = await paymentsRes.json();

      const loans = loansData.loans || [];
      setRecentLoans(loans.slice(0, 5));

      const totalPortfolio = loans.reduce((s: number, l: any) => s + Number(l.balanceRemaining || 0), 0);
      const overdueLoans = loans.filter((l: any) => l.status === 'DEFAULTED').length;

      setStats({
        activeLoans: loansData.total || loans.length,
        totalPortfolio,
        overdueLoans,
        todayCollected: paymentsData.stats?.totalAmount || 0,
        todayPayments: paymentsData.stats?.totalPayments || 0,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) return <MobileDashboardSkeleton />;

  const kpis = [
    { label: 'Préstamos Activos', value: stats?.activeLoans ?? 0, icon: CreditCard, color: 'bg-blue-500', valueClass: 'text-blue-600' },
    { label: 'Cartera Total', value: fmt(stats?.totalPortfolio ?? 0), icon: TrendingUp, color: 'bg-emerald-500', valueClass: 'text-emerald-600' },
    { label: 'Cobrado Hoy', value: fmt(stats?.todayCollected ?? 0), icon: DollarSign, color: 'bg-green-500', valueClass: 'text-green-600' },
    { label: 'En Mora', value: stats?.overdueLoans ?? 0, icon: AlertTriangle, color: 'bg-red-500', valueClass: 'text-red-600' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 pt-12 pb-6 safe-area-top">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-blue-200 text-sm font-medium">Bienvenido</p>
            <h1 className="text-2xl font-black tracking-tight">{session?.user?.name?.split(' ')[0]}</h1>
            <p className="text-blue-200 text-xs mt-0.5">{new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          </div>
          <button onClick={loadDashboard} className="bg-white/20 p-2.5 rounded-xl active:scale-95 transition-transform">
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="px-4 -mt-3 space-y-4 pb-4">
        {/* KPI Grid */}
        <div className="grid grid-cols-2 gap-3">
          {kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <Card key={kpi.label} className="rounded-2xl border-0 shadow-sm overflow-hidden">
                <CardContent className="p-4">
                  <div className={`w-9 h-9 ${kpi.color} rounded-xl flex items-center justify-center mb-2.5`}>
                    <Icon className="h-4.5 w-4.5 text-white" />
                  </div>
                  <p className={`text-xl font-black ${kpi.valueClass}`}>{kpi.value}</p>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">{kpi.label}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Acciones Rápidas</p>
            <div className="grid grid-cols-2 gap-2.5">
              <Link href="/pwa/admin/payments/new">
                <div className="bg-emerald-600 text-white rounded-xl p-3 flex items-center gap-2 active:scale-95 transition-transform">
                  <DollarSign className="h-4 w-4" />
                  <span className="text-xs font-bold">Cobrar</span>
                </div>
              </Link>
              <Link href="/pwa/admin/clients">
                <div className="bg-blue-600 text-white rounded-xl p-3 flex items-center gap-2 active:scale-95 transition-transform">
                  <Users className="h-4 w-4" />
                  <span className="text-xs font-bold">Clientes</span>
                </div>
              </Link>
              <Link href="/pwa/admin/loans">
                <div className="bg-slate-700 text-white rounded-xl p-3 flex items-center gap-2 active:scale-95 transition-transform">
                  <CreditCard className="h-4 w-4" />
                  <span className="text-xs font-bold">Cartera</span>
                </div>
              </Link>
              <Link href="/pwa/admin/commissions">
                <div className="bg-indigo-600 text-white rounded-xl p-3 flex items-center gap-2 active:scale-95 transition-transform">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs font-bold">Comisiones</span>
                </div>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Loans */}
        <Card className="rounded-2xl border-0 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-3">
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Últimos Préstamos</p>
              <Link href="/pwa/admin/loans" className="text-blue-600 text-xs font-bold flex items-center gap-0.5">
                Ver todos <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2.5">
              {recentLoans.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4 italic">Sin préstamos activos</p>
              ) : (
                recentLoans.map((loan: any) => (
                  <Link key={loan.id} href={`/admin/loans/${loan.id}`}>
                    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 dark:border-slate-800 last:border-0 active:bg-slate-50 rounded-lg px-1 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                          {loan.client?.firstName} {loan.client?.lastName}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">{loan.loanNumber}</p>
                      </div>
                      <div className="text-right flex-shrink-0 ml-2">
                        <p className="text-sm font-black text-slate-800 dark:text-slate-200">
                          {fmt(Number(loan.balanceRemaining || 0))}
                        </p>
                        <Badge className={`text-[9px] font-bold ${loan.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-red-500'} text-white`}>
                          {loan.status === 'ACTIVE' ? 'Activo' : loan.status}
                        </Badge>
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
