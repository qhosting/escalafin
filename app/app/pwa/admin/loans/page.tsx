'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, DollarSign, Navigation, Phone } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

const fmt = (n: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n);

export default function PWAAdminLoansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (session?.user) loadLoans();
  }, [session]);

  const loadLoans = async (q = '') => {
    setLoading(true);
    try {
      const url = q ? `/api/loans/search?q=${encodeURIComponent(q)}&includeClient=true` : '/api/loans?status=ACTIVE&limit=50';
      const res = await fetch(url);
      const data = await res.json();
      setLoans(data.loans || []);
    } catch (e) {
      toast.error('Error cargando préstamos');
    } finally {
      setLoading(false);
    }
  };

  const openMaps = (address: string) => {
    if (address) window.open(`https://maps.google.com/?q=${encodeURIComponent(address)}`, '_blank');
  };

  const call = (phone: string) => {
    if (phone) window.location.href = `tel:${phone}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 text-white px-4 pt-12 pb-5 safe-area-top">
        <h1 className="text-xl font-black tracking-tight">Cartera Activa</h1>
        <p className="text-slate-400 text-xs mt-0.5">{loans.length} préstamos cargados</p>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-3">
        {/* Search */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-sm"
              placeholder="Buscar cliente, préstamo..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadLoans(search)}
            />
          </div>
          <Button size="sm" className="rounded-xl bg-blue-600 hover:bg-blue-700 px-3" onClick={() => loadLoans(search)} disabled={loading}>
            {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
          </Button>
        </div>

        {/* Loan cards */}
        {loading ? (
          <div className="flex justify-center py-12"><RefreshCw className="h-8 w-8 text-blue-600 animate-spin" /></div>
        ) : loans.length === 0 ? (
          <p className="text-center text-slate-400 italic text-sm py-12">No se encontraron préstamos</p>
        ) : (
          loans.map((loan: any) => (
            <Card key={loan.id} className="rounded-2xl border-0 shadow-sm overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2.5">
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-sm text-slate-900 dark:text-white truncate">
                      {loan.client?.firstName} {loan.client?.lastName}
                    </p>
                    <p className="text-[11px] font-mono text-slate-400">{loan.loanNumber}</p>
                  </div>
                  <Badge className={`text-[9px] font-bold ml-2 flex-shrink-0 ${
                    loan.status === 'ACTIVE' ? 'bg-emerald-500 text-white' :
                    loan.status === 'DEFAULTED' ? 'bg-red-500 text-white' : 'bg-slate-400 text-white'
                  }`}>
                    {loan.status === 'ACTIVE' ? 'Activo' : loan.status === 'DEFAULTED' ? 'En Mora' : loan.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs mb-3">
                  <div>
                    <span className="text-slate-400">Saldo</span>
                    <p className="font-black text-red-600">{fmt(Number(loan.balanceRemaining || 0))}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Cuota</span>
                    <p className="font-black text-slate-800 dark:text-slate-200">{fmt(Number(loan.monthlyPayment || 0))}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Link href={`/pwa/admin/payments/new?loanId=${loan.id}`} className="flex-1">
                    <div className="bg-emerald-600 text-white text-xs font-bold text-center py-2.5 rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
                      <DollarSign className="h-3.5 w-3.5" /> Cobrar
                    </div>
                  </Link>
                  {loan.client?.phone && (
                    <button onClick={() => call(loan.client.phone)} className="p-2.5 rounded-xl border border-slate-200 active:scale-95 transition-transform">
                      <Phone className="h-4 w-4 text-slate-600" />
                    </button>
                  )}
                  {loan.client?.address && (
                    <button onClick={() => openMaps(loan.client.address)} className="p-2.5 rounded-xl border border-slate-200 active:scale-95 transition-transform">
                      <Navigation className="h-4 w-4 text-slate-600" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
