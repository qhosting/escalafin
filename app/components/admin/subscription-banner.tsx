
'use client';

import React from 'react';
import useSWR from 'swr';
import { AlertTriangle, Info, Zap, ArrowRight, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SubscriptionBanner() {
    const { data: usage, error } = useSWR('/api/billing/usage', fetcher);

    if (!usage || error) return null;

    const { plan, alerts, isTrialing } = usage;
    const hasOverLimit = alerts?.overLimit?.length > 0;
    const hasNearLimit = alerts?.nearLimit?.length > 0;

    // Si todo está bien y no es trial, no mostrar nada
    if (!hasOverLimit && !hasNearLimit && !plan.isTrialing) return null;

    return (
        <div className={`mb-6 p-4 rounded-xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all animate-in fade-in slide-in-from-top-4 duration-500 ${hasOverLimit
                ? 'bg-red-50 border-red-200 text-red-900'
                : hasNearLimit
                    ? 'bg-amber-50 border-amber-200 text-amber-900'
                    : 'bg-indigo-50 border-indigo-200 text-indigo-900'
            }`}>
            <div className="flex items-center gap-4">
                <div className={`p-2 rounded-full hidden sm:block ${hasOverLimit ? 'bg-red-100' : hasNearLimit ? 'bg-amber-100' : 'bg-indigo-100'
                    }`}>
                    {hasOverLimit ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                    ) : hasNearLimit ? (
                        <Zap className="h-5 w-5 text-amber-600" />
                    ) : (
                        <Info className="h-5 w-5 text-indigo-600" />
                    )}
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-bold">
                            {hasOverLimit
                                ? '¡Límite alcanzado!'
                                : hasNearLimit
                                    ? 'Cerca del límite'
                                    : plan.isTrialing
                                        ? 'Periodo de Prueba Activo'
                                        : 'Información de Plan'}
                        </span>
                        <Badge variant="outline" className={
                            hasOverLimit ? 'border-red-300 text-red-700' :
                                hasNearLimit ? 'border-amber-300 text-amber-700' :
                                    'border-indigo-300 text-indigo-700'
                        }>
                            {plan.displayName}
                        </Badge>
                    </div>
                    <p className="text-sm opacity-90 mt-0.5">
                        {hasOverLimit
                            ? `Has excedido el límite de ${usage.alerts.overLimit[0].name}. Algunas funciones pueden estar restringidas.`
                            : hasNearLimit
                                ? `Has usado el ${usage.alerts.nearLimit[0].percentUsed}% de tu cuota de ${usage.alerts.nearLimit[0].name}.`
                                : `Disfrutas de todas las funciones premium. Tu prueba termina pronto.`}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full md:w-auto">
                <Link href="/admin/billing/subscription" className="w-full md:w-auto">
                    <Button
                        size="sm"
                        variant={hasOverLimit ? "destructive" : "default"}
                        className={`w-full md:w-auto gap-2 font-bold ${!hasOverLimit && 'bg-indigo-600 hover:bg-indigo-700'}`}
                    >
                        {hasOverLimit || hasNearLimit ? 'Mejorar Plan' : 'Ver Planes'}
                        <ArrowRight className="h-4 w-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
}

export default SubscriptionBanner;
