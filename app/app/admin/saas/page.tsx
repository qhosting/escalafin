'use client';

import React, { useState, useEffect } from 'react';
import {
    BuildingOfficeIcon,
    CreditCardIcon,
    ChartBarIcon,
    UsersIcon,
    CheckCircleIcon,
    XCircleIcon,
    ShieldCheckIcon,
    GlobeAltIcon
} from '@heroicons/react/24/outline';

/**
 * Super Admin SaaS Overview
 * Panel principal para monitorear el pulso de la plataforma SaaS
 */
export default function SaaSOverview() {
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
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">SaaS Management Central</h1>
                <p className="text-gray-500">Monitoreo global de infraestructura, billing y uso de la plataforma.</p>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total MRR"
                    value={`$${stats.totalMRR.toLocaleString()} MXN`}
                    icon={<CreditCardIcon className="h-6 w-6 text-emerald-600" />}
                    trend={stats.growth}
                    trendLabel="este mes"
                />
                <StatCard
                    title="Tenants Activos"
                    value={stats.activeTenants}
                    icon={<BuildingOfficeIcon className="h-6 w-6 text-indigo-600" />}
                    subtitle={`${stats.totalTenants} registrados en total`}
                />
                <StatCard
                    title="Préstamos Emitidos"
                    value={stats.totalLoans.toLocaleString()}
                    icon={<GlobeAltIcon className="h-6 w-6 text-blue-600" />}
                    subtitle="Globalmente en la plataforma"
                />
                <StatCard
                    title="Clientes Registrados"
                    value={stats.totalClients.toLocaleString()}
                    icon={<UsersIcon className="h-6 w-6 text-amber-600" />}
                    subtitle="A través de todos los tenants"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 bg-gray-50/50">
                        <h3 className="font-semibold text-gray-800">Actividad Reciente</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {stats.recentActivity.map((activity: any, idx: number) => (
                            <div key={idx} className="px-5 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex space-x-3">
                                    <div className={`rounded-full p-2 h-fit ${activity.type === 'signup' ? 'bg-blue-100 text-blue-600' :
                                        activity.type === 'payment' ? 'bg-emerald-100 text-emerald-600' :
                                            'bg-purple-100 text-purple-600'
                                        }`}>
                                        {activity.type === 'signup' && <UsersIcon className="h-4 w-4" />}
                                        {activity.type === 'payment' && <CreditCardIcon className="h-4 w-4" />}
                                        {activity.type === 'upgrade' && <ShieldCheckIcon className="h-4 w-4" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {activity.type === 'signup' ? 'Nuevo Registro' :
                                                activity.type === 'payment' ? 'Pago Recibido' :
                                                    'Upgrade de Plan'}
                                        </p>
                                        <p className="text-xs text-gray-600">{activity.tenant} • {activity.date}</p>
                                        {activity.amount && <p className="text-xs font-bold text-emerald-600 mt-1">{activity.amount}</p>}
                                        {activity.plan && <p className="text-xs font-bold text-indigo-600 mt-1">Plan {activity.plan}</p>}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-center">
                        <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Ver todo el historial</button>
                    </div>
                </div>

                {/* Global Usage Chart Simplified */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="font-semibold text-gray-800">Crecimiento de Plataforma</h3>
                        <div className="flex space-x-2">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                                MRR
                            </span>
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                                Tenants
                            </span>
                        </div>
                    </div>
                    <div className="h-[300px] flex items-end space-x-4">
                        {/* Mock Chart Bars */}
                        {[40, 55, 45, 70, 65, 85, 95].map((val, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center space-y-2">
                                <div className="w-full flex justify-center space-x-1 items-end h-full">
                                    <div className="w-4 bg-indigo-500 rounded-t" style={{ height: `${val}%` }}></div>
                                    <div className="w-4 bg-emerald-400 rounded-t" style={{ height: `${val - 15}%` }}></div>
                                </div>
                                <span className="text-[10px] text-gray-400">Mes {idx + 1}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, trendLabel, subtitle }: any) {
    return (
        <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
            <div className="flex justify-between items-start">
                <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
                {trend && (
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                        {trend}
                    </span>
                )}
            </div>
            <div className="mt-4">
                <p className="text-sm text-gray-500 font-medium">{title}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                {(trendLabel || subtitle) && (
                    <p className="text-xs text-gray-400 mt-2 font-medium">
                        {trendLabel ? `${trendLabel}` : subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
