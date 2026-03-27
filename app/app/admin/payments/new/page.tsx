'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import CashPaymentForm from '@/components/payments/cash-payment-form';
import { AuthWrapper } from '@/components/auth-wrapper';
import { Label } from '@/components/ui/label';
import { Search, Landmark, User, Hash, ChevronRight, ArrowLeft, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function NewPaymentContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const initialLoanId = searchParams.get('loanId');

    const [loan, setLoan] = useState<any>(null);
    const [loans, setLoans] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [errorInfo, setErrorInfo] = useState<{ code?: string; message?: string } | null>(null);

    // Fetch single loan if ID provided
    useEffect(() => {
        if (initialLoanId) {
            setLoading(true);
            setErrorInfo(null);
            fetch(`/api/loans/${initialLoanId}`)
                .then(async res => {
                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        setErrorInfo({
                            code: errorData.code || (res.status === 403 ? 'CROSS_TENANT_ACCESS' : 'NOT_FOUND'),
                            message: errorData.message || errorData.error || 'No se pudo cargar el préstamo.'
                        });
                        setLoading(false);
                        return;
                    }
                    return res.json();
                })
                .then(data => {
                    if (data) {
                        setLoan(data.loan || data);
                    }
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setErrorInfo({ code: 'NETWORK_ERROR', message: 'No se pudo conectar con el servidor.' });
                    setLoading(false);
                });
        } else {
            // Fetch all active loans for selection
            setLoading(true);
            fetch(`/api/loans?status=ACTIVE&limit=200`)
                .then(res => res.json())
                .then(data => {
                    setLoans(data.loans || []);
                    setLoading(false);
                })
                .catch(err => {
                    console.error(err);
                    setLoading(false);
                });
        }
    }, [initialLoanId]);

    const filteredLoans = loans.filter(l => {
        const query = search.toLowerCase();
        return (
            l.loanNumber?.toLowerCase().includes(query) ||
            l.client?.firstName?.toLowerCase().includes(query) ||
            l.client?.lastName?.toLowerCase().includes(query)
        );
    });

    // Error state - premium view
    if (errorInfo) {
        const isCrossTenant = errorInfo.code === 'CROSS_TENANT_ACCESS';
        return (
            <div className="max-w-lg mx-auto px-4 py-12 md:py-20">
                <div className="text-center space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    {/* Icono */}
                    <div className={cn(
                        'mx-auto w-20 h-20 rounded-3xl flex items-center justify-center',
                        isCrossTenant ? 'bg-red-100 dark:bg-red-900/20' : 'bg-orange-100 dark:bg-orange-900/20'
                    )}>
                        {isCrossTenant ? (
                            <ShieldAlert className="h-10 w-10 text-red-600" />
                        ) : (
                            <AlertTriangle className="h-10 w-10 text-orange-600" />
                        )}
                    </div>

                    {/* Mensaje */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black text-foreground">
                            {isCrossTenant ? 'Acceso No Autorizado' : 'Préstamo No Encontrado'}
                        </h2>
                        <p className="text-muted-foreground font-medium leading-relaxed">
                            {errorInfo.message}
                        </p>
                    </div>

                    {/* Badge de seguridad */}
                    {isCrossTenant && (
                        <div className="inline-flex items-center gap-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-2.5">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                            <span className="text-xs font-black text-red-700 dark:text-red-400 uppercase tracking-widest">
                                Aislamiento de datos activo
                            </span>
                        </div>
                    )}

                    {/* Acciones */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Link href="/admin/loans">
                            <Button className="rounded-2xl h-12 px-6 font-bold">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Ir a Mis Préstamos
                            </Button>
                        </Link>
                        <Link href="/admin/payments/new">
                            <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold">
                                Seleccionar Otro Préstamo
                            </Button>
                        </Link>
                    </div>

                    {/* Ref técnica */}
                    {initialLoanId && (
                        <p className="text-[10px] font-mono text-muted-foreground/50 uppercase tracking-widest">
                            REF: {initialLoanId.substring(0, 12)}… • {errorInfo.code}
                        </p>
                    )}
                </div>
            </div>
        );
    }

    if (loading && !loan) {
        return (
            <div className="flex flex-col items-center justify-center p-20 gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="font-bold text-gray-500 animate-pulse">Cargando información...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-6 md:py-12 space-y-8">
            {/* Si no hay préstamo seleccionado, mostrar el selector */}
            {!loan ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="space-y-2">
                        <Badge className="bg-blue-600/10 text-blue-700 border-0 font-black text-[10px] uppercase tracking-widest px-3">
                            Selección de Cartera
                        </Badge>
                        <h1 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
                            Seleccione <span className="text-blue-600">Préstamo</span>
                        </h1>
                        <p className="text-gray-500 font-medium">Busque por número de préstamo o nombre del cliente para iniciar el cobro.</p>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                        <Input
                            placeholder="Buscar préstamo o cliente..."
                            className="pl-14 h-16 md:h-20 rounded-3xl border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl shadow-gray-200/20 dark:shadow-none font-bold text-xl md:text-2xl transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {filteredLoans.length > 0 ? (
                            filteredLoans.map((l) => (
                                <Card 
                                    key={l.id} 
                                    className="rounded-3xl cursor-pointer hover:border-blue-500 hover:shadow-2xl hover:shadow-blue-500/10 active:scale-95 transition-all group border-gray-100"
                                    onClick={() => setLoan(l)}
                                >
                                    <CardContent className="p-6 flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                                <Landmark className="h-7 w-7" />
                                            </div>
                                            <div className="space-y-0.5">
                                                <div className="flex items-center gap-2">
                                                    <Hash className="h-3 w-3 text-gray-400" />
                                                    <span className="text-sm font-black text-gray-400 uppercase tracking-tighter">{l.loanNumber}</span>
                                                </div>
                                                <p className="text-xl font-black text-gray-900 dark:text-white leading-none">
                                                    {l.client?.firstName} {l.client?.lastName}
                                                </p>
                                                <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                                                    <User className="h-3 w-3" />
                                                    {l.client?.phone || 'Sin teléfono'}
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="h-6 w-6 text-gray-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                                    </CardContent>
                                </Card>
                            ))
                        ) : (
                            <div className="col-span-full p-20 text-center space-y-4 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
                                <Search className="h-12 w-12 text-gray-300 mx-auto" />
                                <p className="text-gray-400 font-bold">No se encontraron préstamos activos con ese criterio.</p>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <CashPaymentForm
                        loan={loan}
                        onSuccess={() => {
                            router.push(initialLoanId ? `/admin/loans/${initialLoanId}` : '/admin/payments');
                        }}
                        onCancel={() => {
                            if (initialLoanId) router.back();
                            else setLoan(null); // Volver al selector
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export default function NewPaymentPage() {
    return (
        <AuthWrapper allowedRoles={['ADMIN', 'ASESOR']}>
            <Suspense fallback={<div className="flex items-center justify-center p-20"><LoadingSpinner size="lg" /></div>}>
                <NewPaymentContent />
            </Suspense>
        </AuthWrapper>
    );
}
