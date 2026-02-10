
'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, TrendingUp, Users, Wallet, Target } from 'lucide-react';

interface ResourceUsage {
    current: number;
    limit: number;
    percentUsed: number;
    isUnlimited: boolean;
    name: string;
}

interface UsageOverviewProps {
    usageData: {
        usage: Record<string, ResourceUsage>;
        alerts: {
            nearLimit: any[];
            overLimit: any[];
        };
        upgradeSuggestion?: {
            shouldUpgrade: boolean;
            reason: string;
        };
    };
}

export function UsageOverview({ usageData }: UsageOverviewProps) {
    if (!usageData) return null;

    const { usage, alerts, upgradeSuggestion } = usageData;

    const getIcon = (key: string) => {
        switch (key) {
            case 'users': return <Users className="w-4 h-4" />;
            case 'loans': return <Wallet className="w-4 h-4" />;
            case 'clients': return <Target className="w-4 h-4" />;
            default: return <TrendingUp className="w-4 h-4" />;
        }
    };

    const getProgressColor = (percent: number) => {
        if (percent >= 100) return 'bg-rose-500';
        if (percent >= 80) return 'bg-amber-500';
        return 'bg-indigo-600';
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {['users', 'clients', 'loans'].map((key) => {
                    const res = usage[key];
                    if (!res) return null;

                    return (
                        <Card key={key} className="overflow-hidden border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
                                <div className="space-y-1">
                                    <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                                        {getIcon(key)}
                                        {res.name}
                                    </CardTitle>
                                </div>
                                {res.percentUsed >= 80 && (
                                    <Badge variant={res.percentUsed >= 100 ? "destructive" : "warning"} className="text-[10px]">
                                        {res.percentUsed >= 100 ? 'Límite Excedido' : 'Cerca del Límite'}
                                    </Badge>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between items-baseline">
                                    <span className="text-2xl font-black text-gray-900">
                                        {res.current}
                                    </span>
                                    <span className="text-xs font-medium text-gray-500">
                                        de {res.isUnlimited ? '∞' : res.limit}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 ${getProgressColor(res.percentUsed)}`}
                                            style={{ width: `${Math.min(res.percentUsed, 100)}%` }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-right text-muted-foreground font-bold">
                                        {res.isUnlimited ? 'Uso Ilimitado' : `${res.percentUsed}% utilizado`}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {upgradeSuggestion?.shouldUpgrade && (
                <Card className="bg-amber-50 border-amber-200 border-dashed">
                    <CardContent className="p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div className="space-y-1">
                            <h4 className="text-sm font-bold text-amber-900">Sugerencia de Mejora</h4>
                            <p className="text-xs text-amber-800 leading-relaxed">
                                {upgradeSuggestion.reason}. Considera subir de nivel tu plan para asegurar el crecimiento ininterrumpido de tu financiera.
                            </p>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
