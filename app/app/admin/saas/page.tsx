
'use client';

import React, { useState, useEffect } from 'react';
import {
    BuildingOfficeIcon,
    CreditCardIcon,
    ChartBarIcon,
    UsersIcon,
    ShieldCheckIcon,
    GlobeAltIcon,
    ArrowTrendingUpIcon,
    ServerIcon,
    ShieldExclamationIcon,
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
    Cell,
    PieChart,
    Pie
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, ExternalLink, Activity, Layers, Server, Settings } from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/skeletons';
const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SaaSOverviewV2() {
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchStats() {
            try {
                const response = await fetch('/api/admin/saas/stats');
                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error loading SaaS stats:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchStats();
    }, []);

    if (loading || !stats) {
        return <DashboardSkeleton />;
    }

    const pieData = (stats.plansBreakdown || []).map((plan: any) => ({ 
        name: plan.name, 
        value: typeof plan === 'object' ? plan.count : 0
    }));

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* 1. Toolbar Ejecutivo del Command Center SaaS */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-card border border-border/80 shadow-xs">
                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-700 dark:text-emerald-400 text-xs font-semibold">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span>Red SaaS Operativa &bull; Multi-Tenant Core</span>
                    </div>
                    <Badge variant="outline" className="text-xs text-muted-foreground hidden md:inline-flex font-mono">
                        PostgreSQL 17.10 &bull; Redis Cache
                    </Badge>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/admin/saas/settings">
                        <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
                            <Settings className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Configuración</span>
                        </Button>
                    </Link>
                    <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs font-medium">
                        <Activity className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Telemetría</span>
                    </Button>
                    <Link href="/admin/billing">
                        <Button size="sm" className="h-8 gap-1.5 text-xs font-medium bg-primary text-primary-foreground">
                            <ArrowTrendingUpIcon className="h-3.5 w-3.5" />
                            <span>Facturación</span>
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Reimagined */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <ModernStatCard
                    title="Ingresos (MRR)"
                    value={`$${stats.totalMRR.toLocaleString()}`}
                    unit="MXN"
                    icon={<CreditCardIcon className="h-6 w-6" />}
                    color="emerald"
                    trend={`${stats.trends.mrr} vs mes ant.`}
                />
                <ModernStatCard
                    title="Ecosistema Tenants"
                    value={stats.activeTenants}
                    unit={`de ${stats.totalTenants} regs`}
                    icon={<BuildingOfficeIcon className="h-6 w-6" />}
                    color="indigo"
                    trend={`${stats.trends.tenants} crecimiento`}
                />
                <ModernStatCard
                    title="Volumen Operativo"
                    value={stats.totalLoans.toLocaleString()}
                    unit="Préstamos"
                    icon={<GlobeAltIcon className="h-6 w-6" />}
                    color="amber"
                    trend={`${stats.trends.loans} actividad`}
                />
                <ModernStatCard
                    title="Carga de Datos"
                    value={stats.totalClients.toLocaleString()}
                    unit="Clientes"
                    icon={<UsersIcon className="h-6 w-6" />}
                    color="rose"
                    trend={`${stats.trends.clients} registros`}
                />
                <Link href="/admin/saas/security" className="block">
                    <ModernStatCard
                        title="Seguridad WAF"
                        value="ACTIVO"
                        unit="Firewall"
                        icon={<ShieldExclamationIcon className="h-6 w-6" />}
                        color="indigo"
                        trend="Monitoreo de Amenazas"
                    />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Growth Chart */}
                <Card className="lg:col-span-8 shadow-xs border-border/80 bg-card overflow-hidden">
                    <CardHeader className="border-b border-border/70 bg-muted/20">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg text-foreground">Crecimiento y Escala</CardTitle>
                                <CardDescription className="text-muted-foreground">Histórico mensual de usuarios, préstamos y clientes activos.</CardDescription>
                            </div>
                            <Activity className="h-5 w-5 text-muted-foreground" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-border/40" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: 'currentColor' }}
                                        className="text-muted-foreground"
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: 'currentColor' }}
                                        className="text-muted-foreground"
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.3)' }}
                                    />
                                    <Area type="monotone" dataKey="usersCount" name="Usuarios" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                    <Area type="monotone" dataKey="loansCount" name="Préstamos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLoans)" />
                                    <Area type="monotone" dataKey="clientsCount" name="Clientes" stroke="#f59e0b" strokeWidth={3} fill="none" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Subscriptions breakdown */}
                <Card className="lg:col-span-4 shadow-xs border-border/80 bg-card">
                    <CardHeader className="border-b border-border/70 bg-muted/20">
                        <CardTitle className="text-lg text-foreground">Incentivos y Mezcla</CardTitle>
                        <CardDescription className="text-muted-foreground">Suscripciones activas por plan.</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={8}
                                        dataKey="value"
                                    >
                                        {pieData.map((entry: any, index: number) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: 'var(--card)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 mt-4">
                            {pieData.map((entry: any, index: number) => (
                                <div key={entry.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-muted-foreground font-medium">{entry.name}</span>
                                    </div>
                                    <span className="font-bold text-foreground">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Tenants */}
                <Card className="lg:col-span-1 shadow-xs border-border/80 bg-card">
                    <CardHeader className="border-b border-border/70 bg-muted/20">
                        <CardTitle className="text-md text-foreground flex items-center justify-between">
                            Nuevos Despliegues
                            <Layers className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-border/60">
                            {stats.recentActivity.map((activity: any) => (
                                <div key={activity.id} className="p-4 hover:bg-muted/30 transition-colors group flex items-start gap-3">
                                    <div className="mt-1 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs ring-2 ring-border shadow-xs lowercase">
                                        {activity.tenant[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-foreground truncate">{activity.tenant}</h4>
                                            <span className="text-[10px] text-muted-foreground">{new Date(activity.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-[10px] py-0">{activity.plan}</Badge>
                                            <span className="text-[10px] text-muted-foreground">Instancia Activa</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 bg-muted/20 border-t border-border/70">
                            <Link href="/admin/saas/tenants" className="w-full block">
                                <Button variant="ghost" className="w-full text-xs text-primary font-bold hover:bg-primary/10" size="sm">
                                    Ver todos los Tenants
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Infrastructure Monitor */}
                <Card className="lg:col-span-2 shadow-xs border-border/80 bg-card">
                    <CardHeader className="border-b border-border/70 bg-muted/20">
                        <CardTitle className="text-md text-foreground flex items-center justify-between">
                            Monitoreo de Infraestructura
                            <Server className="h-4 w-4 text-muted-foreground" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                        <span>Tamaño Base de Datos ({stats.infrastructure.dbSize})</span>
                                        <span className="text-primary font-mono">
                                            {((stats.infrastructure.dbBytes / (1024 * 1024 * 1024)) * 100).toFixed(1)}% 
                                            <span className="text-[10px] text-muted-foreground ml-1">de 1GB cuota</span>
                                        </span>
                                    </div>
                                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-primary rounded-full transition-all duration-1000" 
                                            style={{ width: `${Math.min(100, (stats.infrastructure.dbBytes / (1024 * 1024 * 1024)) * 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground tracking-wider">
                                        <span>Rendimiento API (Latencia DB)</span>
                                        <span className={stats.infrastructure.dbLatency < 100 ? "text-emerald-500 font-mono" : "text-amber-500 font-mono"}>
                                            {stats.infrastructure.dbLatency}ms
                                        </span>
                                    </div>
                                    <div className="flex items-end gap-1 h-8">
                                        {[40, 60, 30, 80, 50, 90, 45, 70, 60, 85, 40, 55].map((h, i) => (
                                            <div key={i} className="flex-1 bg-emerald-500/20 group hover:bg-emerald-500 transition-colors h-full flex flex-col justify-end rounded-t-sm">
                                                <div className="w-full bg-emerald-500 rounded-t-sm" style={{ height: `${h}%` }}></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 rounded-xl p-6 text-white text-center relative overflow-hidden border border-indigo-500/20 shadow-xl">
                                <GlobeAltIcon className="h-32 w-32 absolute -bottom-10 -right-10 opacity-10" />
                                <h4 className="text-lg font-bold mb-2 text-white">Estado Proceso Node.js</h4>
                                <p className="text-slate-300 text-xs leading-relaxed mb-4">Memoria Heap: {stats.infrastructure.memoryUsage.percentUsed}% utilizada ({stats.infrastructure.memoryUsage.heapUsed.toFixed(0)} MB)</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Latencia Redis</p>
                                        <p className="text-xl font-black text-white">{stats.infrastructure.redisLatency}ms</p>
                                    </div>
                                    <div className="bg-slate-800/60 p-3 rounded-lg border border-slate-700/60">
                                        <p className="text-[10px] uppercase font-bold text-slate-400">Uptime Total</p>
                                        <p className="text-xl font-black text-white">{(stats.infrastructure.uptime / 3600).toFixed(1)}h</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

function ModernStatCard({ title, value, unit, icon, color, trend }: any) {
    const colorClasses = {
        indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
        emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    }[color as 'indigo' | 'emerald' | 'amber' | 'rose'] || 'bg-primary/10 text-primary border-primary/20';

    return (
        <Card className="border border-border/80 shadow-xs hover:border-primary/40 hover:shadow-md transition-all duration-200 group">
            <CardContent className="p-4 sm:p-5">
                <div className="flex justify-between items-start">
                    <div className={`p-2.5 rounded-xl border ${colorClasses}`}>
                        {icon}
                    </div>
                </div>
                <div className="mt-4">
                    <p className="text-[11px] font-semibold uppercase text-muted-foreground tracking-wider">{title}</p>
                    <div className="flex items-baseline gap-1.5 mt-1">
                        <span className="text-2xl font-bold text-foreground tracking-tight">{value}</span>
                        <span className="text-xs font-medium text-muted-foreground">{unit}</span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between">
                        <span className="text-[11px] font-medium text-muted-foreground">{trend}</span>
                        <ArrowTrendingUpIcon className="h-3.5 w-3.5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
