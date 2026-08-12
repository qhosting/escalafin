'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, RefreshCw, DollarSign, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import CashPaymentForm from '@/components/payments/cash-payment-form';

function PWAPaymentContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedLoanId = searchParams.get('loanId');

  const [loans, setLoans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedLoan, setSelectedLoan] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/login');
  }, [status, router]);

  useEffect(() => {
    if (preselectedLoanId && session?.user) {
      loadLoanById(preselectedLoanId);
    }
  }, [preselectedLoanId, session]);

  const loadLoanById = async (id: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/loans/${id}`);
      const data = await res.json();
      if (data.loan || data.id) setSelectedLoan(data.loan || data);
    } catch (e) {
      toast.error('Error cargando préstamo');
    } finally {
      setLoading(false);
    }
  };

  const searchLoans = async () => {
    if (!search.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/loans/search?q=${encodeURIComponent(search)}&includeClient=true`);
      const data = await res.json();
      setLoans(data.loans || []);
      if (!data.loans?.length) toast.info('No se encontraron préstamos');
    } catch (e) {
      toast.error('Error buscando préstamos');
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = (payment: any) => {
    setSuccess(true);
    toast.success('¡Pago registrado exitosamente!');
    setTimeout(() => {
      setSelectedLoan(null);
      setLoans([]);
      setSearch('');
      setSuccess(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 pt-12 pb-5 safe-area-top">
        <h1 className="text-xl font-black tracking-tight">Cobrar Pago</h1>
        <p className="text-emerald-200 text-xs mt-0.5">Registro rápido en caja o campo</p>
      </div>

      <div className="px-4 pt-4 pb-4 space-y-4">
        {success ? (
          <Card className="rounded-2xl border-0 shadow-sm">
            <CardContent className="p-8 flex flex-col items-center justify-center">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 mb-4" />
              <p className="text-xl font-black text-slate-900">¡Pago Registrado!</p>
              <p className="text-sm text-slate-500 mt-1 text-center">El recibo fue generado exitosamente</p>
            </CardContent>
          </Card>
        ) : selectedLoan ? (
          <div>
            <Button variant="ghost" size="sm" onClick={() => setSelectedLoan(null)} className="mb-3 text-slate-600">
              ← Volver a búsqueda
            </Button>
            <CashPaymentForm
              loan={selectedLoan}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setSelectedLoan(null)}
            />
          </div>
        ) : (
          <>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9 rounded-xl bg-white dark:bg-slate-900 border-slate-200 text-sm"
                  placeholder="Nombre del cliente o préstamo..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchLoans()}
                />
              </div>
              <Button size="sm" className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3" onClick={searchLoans} disabled={loading}>
                {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              </Button>
            </div>

            {loans.map((loan: any) => (
              <Card key={loan.id} className="rounded-2xl border-0 shadow-sm cursor-pointer active:scale-98 transition-transform" onClick={() => setSelectedLoan(loan)}>
                <CardContent className="p-4 flex justify-between items-center">
                  <div>
                    <p className="font-black text-sm text-slate-900">{loan.client?.firstName} {loan.client?.lastName}</p>
                    <p className="text-[11px] text-slate-400 font-mono">{loan.loanNumber}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-red-600">
                      {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(Number(loan.balanceRemaining || 0))}
                    </p>
                    <div className="flex items-center gap-1 mt-1 justify-end">
                      <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-600 text-xs font-bold">Cobrar</span>
                    </div>
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

export default function PWAAdminPaymentsNewPage() {
  return (
    <Suspense fallback={<div className="flex justify-center pt-20"><RefreshCw className="h-8 w-8 animate-spin text-blue-600" /></div>}>
      <PWAPaymentContent />
    </Suspense>
  );
}
