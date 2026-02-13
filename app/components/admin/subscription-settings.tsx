'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import {
    CreditCard,
    CheckCircle2,
    AlertCircle,
    Package,
    ArrowUpCircle,
    Loader2,
    Calendar,
    HardDrive,
    Users,
    FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SubscriptionSettings() {
    const { data: subscription, isLoading, mutate } = useSWR('/api/admin/billing/subscription', fetcher);
    const { data: plans } = useSWR('/api/public/plans', fetcher); // Fetch public plans for upgrade options
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-48">
                <Loader2 className="animate-spin h-8 w-8 text-indigo-600" />
            </div>
        );
    }

    if (!subscription) {
        return (
            <Card className="border-red-100 bg-red-50">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4 text-red-700">
                        <AlertCircle className="h-6 w-6" />
                        <div>
                            <p className="font-bold">No se encontró información de suscripción</p>
                            <p className="text-sm">Contacte a soporte para verificar el estado de su cuenta.</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const { plan, usage, status, currentPeriodEnd } = subscription;
    const isTrial = status === 'TRIALING';
    const limits = plan?.limits ? JSON.parse(plan.limits) : {};

    // Usage Calculations
    const usagePercent = (current: number, max: number) => {
        if (max === -1) return 0; // Unlimited
        return Math.min(100, Math.round((current / max) * 100));
    };

    const handleUpgrade = async (planId: string) => {
        setLoadingAction(true);
        try {
            // Initiate checkout session
            const res = await fetch('/api/admin/billing/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Error al iniciar pago');

            // Redirect to payment URL (Openpay/Stripe hosted page)
            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.success('Solicitud de cambio de plan enviada. Un asesor le contactará.');
                setIsUpgradeOpen(false);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* Current Plan Card */}
            <Card className="overflow-hidden border-indigo-100 shadow-sm relative">
                <div className="absolute top-0 right-0 p-4">
                    <Badge variant={status === 'ACTIVE' ? 'default' : 'secondary'} className={`
                        ${status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100' : ''}
                        ${status === 'TRIALING' ? 'bg-blue-100 text-blue-700 hover:bg-blue-100' : ''}
                        ${status === 'PAST_DUE' ? 'bg-rose-100 text-rose-700 hover:bg-rose-100' : ''}
                        text-sm px-3 py-1 font-bold uppercase tracking-wider border-none
                    `}>
                        {status === 'TRIALING' ? 'Periodo de Prueba' : status === 'ACTIVE' ? 'Activo' : status}
                    </Badge>
                </div>

                <CardHeader className="pb-4 bg-gradient-to-r from-indigo-50 to-white border-b border-indigo-50/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <Package className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div>
                            <CardDescription className="text-indigo-600 font-medium">Plan Actual</CardDescription>
                            <CardTitle className="text-2xl font-bold text-gray-900">{plan.displayName}</CardTitle>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="pt-6 grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3 text-gray-600">
                            <CreditCard className="h-5 w-5 text-gray-400" />
                            <span className="font-medium">Precio:</span>
                            <span className="text-lg font-bold text-gray-900">
                                ${Number(plan.priceMonthly).toLocaleString()} MXN <span className="text-sm font-normal text-gray-500">/ mes</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-3 text-gray-600">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <span className="font-medium">{isTrial ? 'Fin de prueba:' : 'Renovación:'}</span>
                            <span>{format(new Date(currentPeriodEnd), "d 'de' MMMM, yyyy", { locale: es })}</span>
                        </div>

                        <div className="pt-2">
                            <Button onClick={() => setIsUpgradeOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-100">
                                <ArrowUpCircle className="mr-2 h-4 w-4" />
                                {isTrial ? 'Activar Suscripción' : 'Cambiar Plan'}
                            </Button>
                        </div>
                    </div>

                    {/* Usage Stats */}
                    <div className="space-y-5 bg-gray-50 p-4 rounded-xl border border-gray-100">
                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-3">Consumo del Mes</h4>

                        {/* Users Usage */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2 text-gray-600">
                                    <Users className="h-4 w-4" /> Usuarios
                                </span>
                                <span className="font-medium">
                                    {usage?.usersCount || 0} / {limits.users === -1 ? '∞' : limits.users}
                                </span>
                            </div>
                            <Progress value={usagePercent(usage?.usersCount || 0, limits.users)} className="h-2" />
                        </div>

                        {/* Loans Usage */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2 text-gray-600">
                                    <FileText className="h-4 w-4" /> Préstamos Activos
                                </span>
                                <span className="font-medium">
                                    {usage?.loansCount || 0} / {limits.loans === -1 ? '∞' : limits.loans}
                                </span>
                            </div>
                            <Progress value={usagePercent(usage?.loansCount || 0, limits.loans)} className="h-2 bg-gray-200" indicatorClassName="bg-emerald-500" />
                        </div>

                        {/* Storage Usage (Mocked/Optional) */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="flex items-center gap-2 text-gray-600">
                                    <HardDrive className="h-4 w-4" /> Almacenamiento
                                </span>
                                <span className="font-medium">
                                    {(usage?.storage || 0).toFixed(1)} GB / {limits.storageGB === -1 ? '∞' : limits.storageGB} GB
                                </span>
                            </div>
                            <Progress value={usagePercent(usage?.storage || 0, limits.storageGB)} className="h-2 bg-gray-200" indicatorClassName="bg-amber-500" />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Upgrade Dialog */}
            <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
                <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Mejora tu Plan</DialogTitle>
                        <DialogDescription className="text-center text-lg">
                            Elige el plan que mejor se adapte al crecimiento de tu financiera.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="grid md:grid-cols-3 gap-6 py-6">
                        {plans?.filter((p: any) => p.isActive).map((p: any) => (
                            <div key={p.id} className={`
                                border rounded-xl p-6 relative flex flex-col transition-all cursor-pointer hover:border-indigo-300 hover:shadow-lg
                                ${plan.id === p.id ? 'border-indigo-600 bg-indigo-50/30 ring-2 ring-indigo-100' : 'border-gray-200'}
                            `}
                                onClick={() => plan.id !== p.id && handleUpgrade(p.id)}
                            >
                                {p.isPopular && (
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                                        Recomendado
                                    </span>
                                )}
                                <h3 className="text-xl font-bold text-gray-900 text-center">{p.displayName}</h3>
                                <div className="text-center my-4">
                                    <span className="text-3xl font-black text-gray-900">${Number(p.priceMonthly).toLocaleString()}</span>
                                    <span className="text-gray-500 text-sm">/mes</span>
                                </div>
                                <ul className="space-y-3 mb-6 flex-1">
                                    {JSON.parse(p.features || '[]').map((f: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                            <span>{f}</span>
                                        </li>
                                    ))}
                                </ul>
                                <Button
                                    className={`w-full font-bold ${plan.id === p.id ? 'bg-gray-100 text-gray-400 cursor-not-allowed hover:bg-gray-100' : 'bg-indigo-600 hover:bg-indigo-700'}`}
                                    disabled={plan.id === p.id || loadingAction}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (plan.id !== p.id) handleUpgrade(p.id);
                                    }}
                                >
                                    {loadingAction && plan.id !== p.id ? <Loader2 className="animate-spin h-4 w-4" /> :
                                        plan.id === p.id ? 'Plan Actual' : 'Seleccionar'}
                                </Button>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
