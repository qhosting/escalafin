'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, DollarSign, CheckCircle2, Clock } from 'lucide-react';
import { toast } from 'sonner';

const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function PWAAdminCommissionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [commissions, setCommissions] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user) loadCommissions();
  }, [session]);

  const loadCommissions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/commissions?limit=20&status=PENDING');
      const data = await res.json();
      const list = data.commissions || [];
      setCommissions(list);

      // Build summary by advisor
      const byAdvisor: Record<string, any> = {};
      list.forEach((c: any) => {
        const key = c.advisor?.id || 'unknown';
        if (!byAdvisor[key]) {
          byAdvisor[key] = {
            name: `${c.advisor?.firstName || ''} ${c.advisor?.lastName || ''}`.trim(),
            total: 0,
            count: 0,
          };
        }
        byAdvisor[key].total += Number(c.amount);
        byAdvisor[key].count += 1;
      });

      setSummary({
        advisors: Object.values(byAdvisor),
        totalPending: list.reduce((s: number, c: any) => s + Number(c.amount), 0),
        countPending: list.length,
      });
    } catch (e) {
      toast.error('Error cargando comisiones');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 pt-12 pb-5 safe-area-top">
        <h1 className="text-xl font-black tracking-tight">Comisiones</h1>
        <p className="text-indigo-200 text-xs mt-0.5">Resumen de comisiones pendientes</p>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12"><RefreshCw className="h-8 w-8 text-indigo-600 animate-spin" /></div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="w-9 h-9 bg-indigo-500 rounded-xl flex items-center justify-center mb-2">
                    <Clock className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xl font-black text-indigo-600">{summary?.countPending ?? 0}</p>
                  <p className="text-xs text-slate-500 font-medium">Pendientes</p>
                </CardContent>
              </Card>
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="p-4">
                  <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center mb-2">
                    <DollarSign className="h-4 w-4 text-white" />
                  </div>
                  <p className="text-xl font-black text-emerald-600">{fmt(summary?.totalPending ?? 0)}</p>
                  <p className="text-xs text-slate-500 font-medium">Total Pendiente</p>
                </CardContent>
              </Card>
            </div>

            {/* By advisor */}
            {summary?.advisors?.length > 0 && (
              <Card className="rounded-2xl border-0 shadow-sm">
                <CardContent className="p-4">
                  <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-3">Resumen por Asesor</p>
                  <div className="space-y-2.5">
                    {summary.advisors.map((adv: any) => (
                      <div key={adv.name} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                        <div>
                          <p className="text-sm font-bold text-slate-900">{adv.name || 'Sin nombre'}</p>
                          <p className="text-xs text-slate-400">{adv.count} registros</p>
                        </div>
                        <p className="text-sm font-black text-indigo-600">{fmt(adv.total)}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recent commissions */}
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest">Últimas Comisiones</p>
            {commissions.slice(0, 10).map((c: any) => (
              <Card key={c.id} className="rounded-2xl border-0 shadow-sm">
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">
                      {c.advisor?.firstName} {c.advisor?.lastName}
                    </p>
                    <p className="text-xs text-slate-400">{c.sourceType} · {new Date(c.calculatedAt).toLocaleDateString('es-MX')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-emerald-600">{fmt(Number(c.amount))}</p>
                    <Badge className={`text-[9px] font-bold ${c.status === 'PENDING' ? 'bg-amber-500 text-white' : 'bg-emerald-500 text-white'}`}>
                      {c.status === 'PENDING' ? 'Pendiente' : c.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </>
        )}
      </div>
    </div>
  );
}
