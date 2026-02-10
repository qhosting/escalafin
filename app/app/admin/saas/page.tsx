
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
    ServerIcon
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
import { Loader2, ExternalLink, Activity, Layers, Server } from 'lucide-react';

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

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[500px] space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
                <p className="text-gray-500 animate-pulse font-medium">Cargando inteligencia de la plataforma...</p>
            </div>
        );
    }

    const pieData = Object.entries(stats.plansBreakdown || {}).map(([name, value]) => ({ name, value }));

    return (
        <div className="space-y-8 p-1">
            {/* Header Estratégico */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50 font-bold px-3 py-0.5">PLATFORM OWNER</Badge>
                        <span className="text-xs text-gray-400 font-mono">Build v2.1.0-SaaS</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">SaaS Command Center</h1>
                    <p className="text-gray-500 max-w-2xl mt-1">Visión global de EscalaFin: salud de red, monetización y métricas de escala de todos los tenants.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" className="gap-2">
                        <Activity className="w-4 h-4" /> System Health
                    </Button>
                    <Link href="/admin/billing">
                        <Button className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold">
                            <ArrowTrendingUpIcon className="h-4 w-4 mr-2" /> Billing & Growth
                        </Button>
                    </Link>
                </div>
            </div>

            {/* KPI Reimagined */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <ModernStatCard
                    title="Ingresos (MRR)"
                    value={`$${stats.totalMRR.toLocaleString()}`}
                    unit="MXN"
                    icon={<CreditCardIcon className="h-6 w-6" />}
                    color="emerald"
                    trend="+12% vs mes ant."
                />
                <ModernStatCard
                    title="Ecosistema Tenants"
                    value={stats.activeTenants}
                    unit={`de ${stats.totalTenants} regs`}
                    icon={<BuildingOfficeIcon className="h-6 w-6" />}
                    color="indigo"
                    trend={`${stats.activeTenants} activos`}
                />
                <ModernStatCard
                    title="Volumen Operativo"
                    value={stats.totalLoans.toLocaleString()}
                    unit="Préstamos"
                    icon={<GlobeAltIcon className="h-6 w-6" />}
                    color="amber"
                    trend="Carga global activa"
                />
                <ModernStatCard
                    title="Carga de Datos"
                    value={stats.totalClients.toLocaleString()}
                    unit="Clientes"
                    icon={<UsersIcon className="h-6 w-6" />}
                    color="rose"
                    trend="Base de datos única"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Growth Chart */}
                <Card className="lg:col-span-8 shadow-sm border-gray-100 overflow-hidden">
                    <CardHeader className="border-b bg-gray-50/30">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg">Crecimiento y Escala</CardTitle>
                                <CardDescription>Histórico mensual de usuarios, préstamos y clientes activos.</CardDescription>
                            </div>
                            <Activity className="h-5 w-5 text-gray-400" />
                        </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="h-[350px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={stats.chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorLoans" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1} />
                                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                                    <XAxis
                                        dataKey="month"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fontSize: 12, fill: '#9ca3af' }}
                                    />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                    />
                                    <Area type="monotone" dataKey="usersCount" name="Usuarios" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                                    <Area type="monotone" dataKey="loansCount" name="Préstamos" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorLoans)" />
                                    <Area type="monotone" dataKey="clientsCount" name="Clientes" stroke="#f59e0b" strokeWidth={3} fill="none" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Subscriptions breakdown */}
                <Card className="lg:col-span-4 shadow-sm border-gray-100">
                    <CardHeader className="border-b bg-gray-50/30">
                        <CardTitle className="text-lg">Incentivos y Mezcla</CardTitle>
                        <CardDescription>Suscripciones activas por plan.</CardDescription>
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
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="space-y-3 mt-4">
                            {pieData.map((entry, index) => (
                                <div key={entry.name} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                        <span className="text-gray-600 font-medium">{entry.name}</span>
                                    </div>
                                    <span className="font-bold text-gray-900">{entry.value}</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Tenants */}
                <Card className="lg:col-span-1 shadow-sm border-gray-100">
                    <CardHeader className="border-b bg-gray-50/30">
                        <CardTitle className="text-md flex items-center justify-between">
                            Nuevos Despliegues
                            <Layers className="h-4 w-4 text-gray-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-gray-50">
                            {stats.recentActivity.map((activity: any) => (
                                <div key={activity.id} className="p-4 hover:bg-gray-50/50 transition-colors group flex items-start gap-3">
                                    <div className="mt-1 w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors lowercase font-bold text-xs ring-4 ring-white shadow-sm">
                                        {activity.tenant[0]}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <h4 className="text-sm font-bold text-gray-900">{activity.tenant}</h4>
                                            <span className="text-[10px] text-gray-400">{new Date(activity.date).toLocaleDateString()}</span>
                                        </div>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Badge variant="secondary" className="text-[10px] py-0">{activity.plan}</Badge>
                                            <span className="text-[10px] text-gray-400">Instancia Activa</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-3 bg-gray-50/50 border-t">
                            <Link href="/admin/tenants" className="w-full block">
                                <Button variant="ghost" className="w-full text-xs text-indigo-600 font-bold hover:bg-indigo-50" size="sm">
                                    Ver todos los Tenants
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>

                {/* Infrastructure Monitor (Mock) */}
                <Card className="lg:col-span-2 shadow-sm border-gray-100">
                    <CardHeader className="border-b bg-gray-50/30">
                        <CardTitle className="text-md flex items-center justify-between">
                            Monitoreo de Infraestructura
                            <Server className="h-4 w-4 text-gray-400" />
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase text-gray-400 tracking-wider">
                                        <span>Cloud Database Capacity</span>
                                        <span className="text-indigo-600">42%</span>
                                    </div>
                                    <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: '42%' }}></div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-xs font-bold uppercase text-gray-400 tracking-wider">
                                        <span>Global API Throughput</span>
                                        <span className="text-emerald-600">Stable</span>
                                    </div>
                                    <div className="flex items-end gap-1 h-8">
                                        {[40, 60, 30, 80, 50, 90, 45, 70, 60, 85, 40, 55].map((h, i) => (
                                            <div key={i} className="flex-1 bg-emerald-100 group hover:bg-emerald-500 transition-colors h-full flex flex-col justify-end">
                                                <div className="w-full bg-emerald-500 rounded-t" style={{ height: `${h}%` }}></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="bg-indigo-900 rounded-xl p-6 text-white text-center relative overflow-hidden shadow-xl shadow-indigo-200">
                                <GlobeAltIcon className="h-32 w-32 absolute -bottom-10 -right-10 opacity-10" />
                                <h4 className="text-lg font-bold mb-2">Escala Global Ready</h4>
                                <p className="text-indigo-200 text-xs leading-relaxed mb-4">La infraestructura está optimizada para manejar hasta 5,000 tenants concurrentes en esta región.</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-indigo-800/50 p-3 rounded-lg border border-indigo-700">
                                        <p className="text-[10px] uppercase font-bold text-indigo-300">Latencia Prom.</p>
                                        <p className="text-xl font-black">24ms</p>
                                    </div>
                                    <div className="bg-indigo-800/50 p-3 rounded-lg border border-indigo-700">
                                        <p className="text-[10px] uppercase font-bold text-indigo-300">Uptime 90d</p>
                                        <p className="text-xl font-black">99.98%</p>
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
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
    }[color as 'indigo' | 'emerald' | 'amber' | 'rose'];

    return (
        <Card className="shadow-sm border-gray-100 hover:shadow-lg hover:shadow-indigo-50 transition-all duration-300 group border-b-4 border-b-transparent hover:border-b-indigo-500">
            <CardContent className="p-6">
                <div className="flex justify-between items-start">
                    <div className={`p-3 rounded-2xl border ${colorClasses}`}>
                        {icon}
                    </div>
                </div>
                <div className="mt-5">
                    <p className="text-xs font-bold uppercase text-gray-400 tracking-widest">{title}</p>
                    <div className="flex items-baseline gap-2 mt-1">
                        <span className="text-3xl font-black text-gray-900 tracking-tight">{value}</span>
                        <span className="text-sm font-bold text-gray-400">{unit}</span>
                    </div>
                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                        <span className="text-[11px] font-bold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">{trend}</span>
                        <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
