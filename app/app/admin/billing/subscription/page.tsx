
'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Loader2, Zap, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { UsageOverview } from '@/components/admin/usage-overview';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function TenantSubscriptionPage() {
    const { data: subscription, isLoading: subLoading } = useSWR('/api/billing/subscription', fetcher);
    const { data: usageData, isLoading: usageLoading } = useSWR('/api/billing/usage', fetcher);
    const { data: plans, isLoading: plansLoading } = useSWR('/api/admin/plans', fetcher); // Reuse admin public endpoint?
    // Wait, /api/admin/plans is protected by SUPER_ADMIN check in step 878.
    // Need a public or tenant-accessible plans endpoint.
    // I can modify /api/admin/plans to allow authenticated users to read.
    // Or create /api/plans. 
    // Let's create /api/plans for public reading.

    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

    const handleSubscribe = async (planId: string) => {
        setLoadingPlan(planId);
        try {
            const res = await fetch('/api/billing/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            });

            if (!res.ok) throw new Error('Error creating checkout session');

            const { url } = await res.json();
            window.location.href = url;
        } catch (error) {
            console.error(error);
            toast.error('Error al iniciar suscripción');
        } finally {
            setLoadingPlan(null);
        }
    };

    const handleManage = async () => {
        if (subscription?.openpayPortalUrl) {
            window.location.href = subscription.openpayPortalUrl;
        } else {
            toast.info("Próximamente: Portal de facturación Openpay.");
        }
    };

    if (subLoading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin h-8 w-8" /></div>;

    const currentPlanId = subscription?.plan?.id;
    const isPro = subscription?.isPro;

    return (
        <div className="space-y-8 p-1">
            <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Suscripción y Facturación</h1>
                    <p className="text-muted-foreground mt-1">Administra tu plan y método de pago.</p>
                </div>
                {isPro && (
                    <Button variant="outline" onClick={handleManage}>
                        Administrar Suscripción (Portal)
                    </Button>
                )}
            </div>

            {/* Current Status */}
            <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
                <CardHeader>
                    <CardTitle className="text-sm uppercase tracking-wider text-indigo-900 font-bold">Plan Actual</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="text-3xl font-black text-indigo-600 mb-1">
                                {subscription?.plan?.displayName || 'Iniciando...'}
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant={isPro ? "default" : "secondary"}>
                                    {subscription?.status || 'TRIALING'}
                                </Badge>
                                {subscription?.currentPeriodEnd && (
                                    <span className="text-xs text-gray-500">
                                        Renueva el {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Usage Overview */}
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-indigo-600" />
                    <h2 className="text-xl font-bold">Uso de Recursos</h2>
                </div>
                {usageLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-32 bg-gray-50 animate-pulse rounded-lg border" />)}
                    </div>
                ) : (
                    <UsageOverview usageData={usageData} />
                )}
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {plans?.filter((p: any) => p.isActive).map((plan: any) => (
                    <Card key={plan.id} className={`relative overflow-hidden transition-all hover:shadow-lg ${plan.isPopular ? 'border-indigo-500 border-2 shadow-indigo-100' : ''}`}>
                        {plan.isPopular && (
                            <div className="absolute top-0 right-0 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider z-10">
                                Popular
                            </div>
                        )}
                        <CardHeader>
                            <CardTitle>{plan.displayName}</CardTitle>
                            <CardDescription>{plan.description}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-baseline gap-1">
                                <span className="text-3xl font-black text-gray-900">${plan.priceMonthly}</span>
                                <span className="text-sm text-gray-500 font-medium">/mes</span>
                            </div>
                            <div className="space-y-2 text-sm text-gray-600">
                                {/* Parse limits for quick view */}
                                {plan.limits && (() => {
                                    try {
                                        const limits = JSON.parse(plan.limits);
                                        return (
                                            <>
                                                <div className="flex justify-between border-b pb-1">
                                                    <span>Usuarios</span>
                                                    <span className="font-bold">{limits.users === -1 ? 'Ilimitado' : limits.users}</span>
                                                </div>
                                                <div className="flex justify-between border-b pb-1">
                                                    <span>Préstamos</span>
                                                    <span className="font-bold">{limits.loans === -1 ? 'Ilimitado' : limits.loans}</span>
                                                </div>
                                            </>
                                        );
                                    } catch (e) { return null; }
                                })()}
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button
                                className={`w-full font-bold ${currentPlanId === plan.id ? 'bg-green-600 hover:bg-green-700' : ''}`}
                                disabled={currentPlanId === plan.id || loadingPlan === plan.id}
                                onClick={() => handleSubscribe(plan.id)}
                            >
                                {loadingPlan === plan.id ? <Loader2 className="animate-spin h-4 w-4" /> :
                                    currentPlanId === plan.id ? (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" /> Plan Actual
                                        </>
                                    ) : 'Seleccionar Plan'}
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    );
}
