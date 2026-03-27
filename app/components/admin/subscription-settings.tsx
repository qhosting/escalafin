
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
    FileText,
    TrendingUp,
    ShieldCheck,
    Zap,
    ChevronRight,
    CircleDashed,
    Receipt
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SubscriptionSettings() {
    const { data: subscription, isLoading, mutate, error } = useSWR('/api/admin/billing/subscription', fetcher);
    const { data: plansData } = useSWR('/api/public/plans', fetcher);
    const [isUpgradeOpen, setIsUpgradeOpen] = useState(false);
    const [loadingAction, setLoadingAction] = useState(false);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-24 gap-4 animate-in fade-in duration-700">
                <Loader2 className="animate-spin h-12 w-12 text-indigo-600" />
                <p className="text-slate-500 font-bold tracking-tight">Sincronizando con el servidor de facturación...</p>
            </div>
        );
    }

    if (error || !subscription) {
        return (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-700">
            <Card className="border-none shadow-2xl rounded-3xl overflow-hidden bg-slate-900 text-white">
                <CardContent className="p-12 text-center space-y-6">
                    <div className="mx-auto w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center backdrop-blur-md border border-white/5">
                        <AlertCircle className="h-10 w-10 text-rose-400" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black tracking-tight">Información No Encontrada</h3>
                        <p className="text-slate-400 font-medium text-lg mt-2">
                           Tu cuenta aún no tiene un plan activo vinculado. 
                           Contacta a soporte o activa un periodo de prueba.
                        </p>
                    </div>
                    <div className="flex justify-center gap-4">
                        <Button variant="outline" className="rounded-2xl border-white/20 hover:bg-white/5 px-8 h-12 font-bold">
                           Contactar Soporte
                        </Button>
                        <Button className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 px-8 h-12 font-bold shadow-xl shadow-indigo-500/20">
                           Explorar Planes
                        </Button>
                    </div>
                </CardContent>
            </Card>
          </div>
        );
    }

    const { plan, usage, status, currentPeriodEnd } = subscription;
    const isTrial = status === 'TRIALING';
    const limits = plan?.limits ? JSON.parse(plan.limits) : {};
    const features = plan?.features ? JSON.parse(plan.features) : [];
    const plans = plansData?.plans || plansData || []; // Handle different API shapes

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'ACTIVE': return { label: 'Activo', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' };
            case 'TRIALING': return { label: 'Periodo de Prueba', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' };
            case 'PAST_DUE': return { label: 'Pago Pendiente', color: 'bg-rose-100 text-rose-700 border-rose-200' };
            case 'CANCELED': return { label: 'Cancelado', color: 'bg-slate-100 text-slate-700 border-slate-200' };
            default: return { label: status, color: 'bg-gray-100 text-gray-700 border-gray-200' };
        }
    };

    const statusInfo = getStatusInfo(status);

    const usagePercent = (current: number, max: number) => {
        if (!max || max === -1) return 0;
        return Math.min(100, Math.round((current / max) * 100));
    };

    const handleUpgrade = async (planId: string) => {
        setLoadingAction(true);
        try {
            const res = await fetch('/api/admin/billing/create-checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Error al iniciar pago');

            if (data.url) {
                window.location.href = data.url;
            } else {
                toast.success('Solicitud procesada con éxito');
                mutate();
                setIsUpgradeOpen(false);
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoadingAction(false);
        }
    };

    return (
        <div className="space-y-10 max-w-6xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Premium Header Card */}
            <div className="grid lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-2xl overflow-hidden relative group">
                    {/* Background decoration */}
                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none group-hover:rotate-12 transition-transform duration-1000">
                        <Package className="w-64 h-64" />
                    </div>
                    
                    <CardHeader className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-indigo-900 border-none p-10 text-white relative z-10">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="space-y-2">
                                <div className="flex items-center gap-3">
                                    <Badge className={`rounded-xl px-4 py-1.5 font-black uppercase text-[10px] tracking-widest border-none ${statusInfo.color}`}>
                                        <Zap className="w-3 h-3 mr-2" />
                                        {statusInfo.label}
                                    </Badge>
                                    <span className="text-indigo-200 font-bold text-xs">Vence el {format(new Date(currentPeriodEnd), "dd MMM yyyy", { locale: es })}</span>
                                </div>
                                <h2 className="text-5xl font-black tracking-tighter mt-4">Plan {plan.displayName}</h2>
                                <p className="text-indigo-100 font-medium text-lg leading-relaxed max-w-md opacity-80">
                                    {plan.description || 'Disfruta de todas las características de tu plan premium activo.'}
                                </p>
                            </div>
                            
                            <div className="flex flex-col items-end gap-3">
                                <div className="text-right">
                                    <p className="text-indigo-200 text-sm font-bold uppercase tracking-widest">Inversión Mensual</p>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-4xl font-black">${Number(plan.priceMonthly).toLocaleString()}</span>
                                        <span className="text-lg font-bold opacity-60">MXN</span>
                                    </div>
                                </div>
                                <Button 
                                  onClick={() => setIsUpgradeOpen(true)}
                                  className="rounded-2xl bg-white text-indigo-700 hover:bg-indigo-50 font-black px-8 h-14 shadow-2xl shadow-indigo-500/20 text-lg transition-transform hover:scale-105 active:scale-95"
                                >
                                    <ArrowUpCircle className="mr-2 h-5 w-5" />
                                    Mejorar Plan
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                    
                    <CardContent className="bg-white p-10">
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <h4 className="flex items-center gap-2 text-slate-800 font-black uppercase text-xs tracking-widest">
                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                    Características Incluidas
                                </h4>
                                <div className="grid gap-4">
                                    {features.map((feature: string, i: number) => (
                                        <div key={i} className="flex items-center gap-3 group">
                                            <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-500 transition-colors">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 group-hover:text-white" />
                                            </div>
                                            <span className="text-slate-600 font-medium text-sm group-hover:text-slate-900">{feature}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 space-y-6">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-slate-800 font-black uppercase text-xs tracking-widest flex items-center gap-2">
                                        <TrendingUp className="w-4 h-4 text-indigo-600" />
                                        Estadísticas de Pago
                                    </h4>
                                    <Badge variant="ghost" className="text-indigo-600 bg-indigo-50 font-bold border-none">
                                        <Receipt className="w-3.5 h-3.5 mr-2" />
                                        Historial
                                    </Badge>
                                </div>
                                
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group hover:border-indigo-200 transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <CreditCard className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-400 uppercase">Método Guardado</p>
                                                <p className="text-slate-800 font-black">Visa •••• 4242</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600" />
                                    </div>
                                    
                                    <div className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm border border-slate-100 group hover:border-indigo-200 transition-all cursor-pointer">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 bg-indigo-50 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                                <Calendar className="w-5 h-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-black text-slate-400 uppercase">Siguiente Recibo</p>
                                                <p className="text-slate-800 font-black">{format(new Date(currentPeriodEnd), "dd 'de' MMMM", { locale: es })}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-600" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Vertical Usage Sidebar */}
                <div className="space-y-6">
                    <h3 className="text-xl font-black text-slate-900 flex items-center gap-2 px-2">
                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                        Uso del Sistema
                    </h3>
                    
                    {[
                        { id: 'users', label: 'Usuarios', icon: <Users className="w-5 h-5" />, current: usage?.usersCount || 0, max: limits.users, color: 'bg-indigo-600' },
                        { id: 'loans', label: 'Créditos', icon: <FileText className="w-5 h-5" />, current: usage?.loansCount || 0, max: limits.loans, color: 'bg-emerald-500' },
                        { id: 'storage', label: 'Almacenamiento', icon: <HardDrive className="w-5 h-5" />, current: (usage?.storage || 0), max: limits.storageGB, color: 'bg-amber-500', isStorage: true },
                    ].map((item) => (
                        <Card key={item.id} className="rounded-3xl border-none shadow-sm ring-1 ring-slate-100 hover:ring-indigo-200 transition-all group overflow-hidden">
                            <CardContent className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2.5 bg-slate-50 text-slate-600 rounded-xl group-hover:bg-white group-hover:shadow-md transition-all">
                                            {item.icon}
                                        </div>
                                        <span className="font-bold text-slate-700">{item.label}</span>
                                    </div>
                                    <Badge variant="ghost" className="font-black text-indigo-600 bg-indigo-50 rounded-lg">
                                        {item.current} / {item.max === -1 ? '∞' : item.max}{item.isStorage ? ' GB' : ''}
                                    </Badge>
                                </div>
                                
                                <div className="space-y-2">
                                    <Progress 
                                      value={usagePercent(item.current, item.max)} 
                                      className="h-2.5 bg-slate-100" 
                                      indicatorClassName={item.color}
                                    />
                                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">
                                        <span>Consumo Actual</span>
                                        <span>{usagePercent(item.current, item.max)}%</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                    
                    <Card className="rounded-3xl bg-slate-900 border-none p-6 text-white relative overflow-hidden group">
                        <div className="absolute -bottom-4 -right-4 p-8 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700">
                            <ShieldCheck className="w-24 h-24" />
                        </div>
                        <div className="relative z-10 space-y-3">
                            <h4 className="font-black text-lg leading-tight">Seguridad Empresarial</h4>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Tu suscripción incluye backups diarios y encriptación de grado militar AES-256.
                            </p>
                            <Button variant="link" className="text-indigo-400 p-0 font-bold hover:text-indigo-300">
                                Ver términos →
                            </Button>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Upgrade Dialog */}
            <Dialog open={isUpgradeOpen} onOpenChange={setIsUpgradeOpen}>
                <DialogContent className="max-w-6xl rounded-[3rem] p-0 overflow-hidden border-none shadow-2xl">
                    <div className="grid lg:grid-cols-4 min-h-[600px]">
                        <div className="lg:col-span-1 bg-slate-900 p-12 text-white flex flex-col justify-between relative overflow-hidden">
                            <div className="relative z-10 space-y-8">
                                <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                    <ArrowUpCircle className="w-10 h-10 text-indigo-400" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-4xl font-black tracking-tighter leading-none">Aumenta tu Escala</h3>
                                    <p className="text-slate-400 font-medium">Diseñado para adaptarse al tamaño real de tu financiera.</p>
                                </div>
                                <div className="space-y-4 pt-4 border-t border-white/5">
                                    <div className="flex gap-3">
                                        <CircleDashed className="w-5 h-5 text-indigo-400 shrink-0" />
                                        <p className="text-xs font-bold text-slate-300 uppercase leading-relaxed">Actualización instantánea</p>
                                    </div>
                                    <div className="flex gap-3">
                                        <CircleDashed className="w-5 h-5 text-indigo-400 shrink-0" />
                                        <p className="text-xs font-bold text-slate-300 uppercase leading-relaxed">Soporte 24/7</p>
                                    </div>
                                </div>
                            </div>
                            <p className="text-[10px] uppercase font-black tracking-widest text-slate-500 opacity-50 relative z-10">Power by EscalaFin Cloud</p>
                        </div>

                        <div className="lg:col-span-3 p-12 bg-slate-50">
                            <div className="grid md:grid-cols-3 gap-6">
                                {plans?.filter((p: any) => p.isActive).map((p: any) => (
                                    <Card key={p.id} className={`
                                        rounded-[2rem] border-none shadow-xl transition-all cursor-pointer flex flex-col p-8 group relative
                                        ${plan.id === p.id ? 'bg-indigo-600 text-white ring-4 ring-indigo-200' : 'bg-white hover:bg-slate-50 hover:-translate-y-2'}
                                    `}
                                        onClick={() => plan.id !== p.id && handleUpgrade(p.id)}
                                    >
                                        {p.isPopular && plan.id !== p.id && (
                                            <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-amber-950 font-black px-4 border-none shadow-lg">
                                                RECOMENDADO
                                            </Badge>
                                        )}
                                        
                                        <div className="text-center space-y-4 mb-8">
                                            <h3 className={`text-2xl font-black ${plan.id === p.id ? 'text-white' : 'text-slate-900'}`}>{p.displayName}</h3>
                                            <div className="space-y-1">
                                                <div className="flex items-baseline justify-center gap-1">
                                                    <span className={`text-4xl font-black ${plan.id === p.id ? 'text-white' : 'text-slate-900'}`}>${Number(p.priceMonthly).toLocaleString()}</span>
                                                    <span className={`font-bold opacity-60 text-xs ${plan.id === p.id ? 'text-white' : 'text-slate-400'}`}>MXN</span>
                                                </div>
                                                <p className={`text-[10px] font-bold uppercase tracking-widest opacity-60`}>Suscripción Mensual</p>
                                            </div>
                                        </div>

                                        <div className={`space-y-4 flex-1 border-t pt-8 ${plan.id === p.id ? 'border-white/10' : 'border-slate-100'}`}>
                                            {JSON.parse(p.features || '[]').slice(0, 5).map((f: string, i: number) => (
                                                <div key={i} className="flex items-start gap-2.5">
                                                    <CheckCircle2 className={`h-4 w-4 shrink-0 mt-0.5 ${plan.id === p.id ? 'text-indigo-200' : 'text-emerald-500'}`} />
                                                    <span className={`text-sm font-bold opacity-90 ${plan.id === p.id ? 'text-white' : 'text-slate-600'}`}>{f}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <Button
                                            className={`w-full mt-8 rounded-2xl h-14 font-black text-lg transition-all
                                              ${plan.id === p.id 
                                                 ? 'bg-white/10 text-white cursor-not-allowed border border-white/20' 
                                                 : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl shadow-indigo-200'}
                                            `}
                                            disabled={plan.id === p.id || loadingAction}
                                        >
                                            {loadingAction && plan.id !== p.id ? <Loader2 className="animate-spin h-5 w-5" /> :
                                                plan.id === p.id ? 'Plan Actual' : 'Seleccionar'}
                                        </Button>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

