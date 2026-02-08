'use client';

import React, { useState, useEffect } from 'react';
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    EllipsisVerticalIcon,
    CheckBadgeIcon,
    ExclamationCircleIcon,
    PauseCircleIcon
} from '@heroicons/react/24/outline';

/**
 * Super Admin: Tenant Management
 * Lista detallada de todos los tenants registrados en el sistema
 */
export default function TenantManager() {
    const [tenants, setTenants] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Mock data para tenants
        setTimeout(() => {
            setTenants([
                { id: '1', name: 'FinanzAuto MX', slug: 'finanzauto', plan: 'Business', status: 'ACTIVE', users: 18, loans: 1450, mrr: 3999, registeredSince: '2025-01-15' },
                { id: '2', name: 'CrediGuate', slug: 'crediguate', plan: 'Professional', status: 'ACTIVE', users: 8, loans: 420, mrr: 1499, registeredSince: '2025-06-20' },
                { id: '3', name: 'PrestaYa', slug: 'prestaya', plan: 'Starter', status: 'PAST_DUE', users: 2, loans: 85, mrr: 499, registeredSince: '2025-11-05' },
                { id: '4', name: 'Escala Demo', slug: 'demo', plan: 'Legacy', status: 'ACTIVE', users: 1, loans: 12, mrr: 0, registeredSince: '2024-05-10' },
                { id: '5', name: 'InverNorte', slug: 'invernorte', plan: 'Professional', status: 'TRIAL', users: 5, loans: 30, mrr: 0, registeredSince: '2026-02-01' },
            ]);
            setLoading(false);
        }, 800);
    }, []);

    const filteredTenants = tenants.filter(t =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.slug.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Gestión de Tenants</h2>
                    <p className="text-sm text-gray-500">Visualiza y administra todas las organizaciones registradas.</p>
                </div>
                <div className="flex space-x-2">
                    <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors">
                        Crear Tenant Manual
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                {/* Table Controls */}
                <div className="p-4 border-b border-gray-50 flex flex-col md:flex-row gap-4 justify-between bg-gray-50/30">
                    <div className="relative flex-1 max-w-md">
                        <MagnifyingGlassIcon className="h-5 w-5 absolute left-3 top-2.5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o slug..."
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex space-x-2">
                        <button className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                            <FunnelIcon className="h-5 w-5 text-gray-500" />
                        </button>
                        <select className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                            <option>Todos los planes</option>
                            <option>Starter</option>
                            <option>Professional</option>
                            <option>Business</option>
                            <option>Enterprise</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                <th className="px-6 py-4">Organización</th>
                                <th className="px-6 py-4">Plan / Status</th>
                                <th className="px-6 py-4">Uso Actual</th>
                                <th className="px-6 py-4">Ingresos (MRR)</th>
                                <th className="px-6 py-4">Registro</th>
                                <th className="px-6 py-4 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">Cargando datos...</td>
                                </tr>
                            ) : filteredTenants.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400 italic">No se encontraron tenants</td>
                                </tr>
                            ) : filteredTenants.map((tenant) => (
                                <tr key={tenant.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-semibold text-gray-900">{tenant.name}</div>
                                        <div className="text-xs text-gray-500">{tenant.slug}.app.com</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col space-y-1">
                                            <span className={`inline-flex w-fit px-2 py-0.5 rounded text-[10px] font-bold ${tenant.plan === 'Business' ? 'bg-purple-100 text-purple-700' :
                                                    tenant.plan === 'Professional' ? 'bg-blue-100 text-blue-700' :
                                                        tenant.plan === 'Starter' ? 'bg-amber-100 text-amber-700' :
                                                            'bg-gray-100 text-gray-700'
                                                }`}>
                                                {tenant.plan.toUpperCase()}
                                            </span>
                                            <StatusBadge status={tenant.status} />
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600">
                                        <div>{tenant.users} usuarios</div>
                                        <div>{tenant.loans.toLocaleString()} préstamos</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">
                                            {tenant.mrr > 0 ? `$${tenant.mrr.toLocaleString()} MXN` : '-'}
                                        </div>
                                        <div className="text-[10px] text-gray-400">Mensual</div>
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {new Date(tenant.registeredSince).toLocaleDateString()}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="p-1 hover:bg-gray-200 rounded-full transition-colors">
                                            <EllipsisVerticalIcon className="h-5 w-5 text-gray-400" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Paging */}
                <div className="px-6 py-4 bg-gray-50/50 border-t border-gray-100 flex justify-between items-center">
                    <p className="text-xs text-gray-500">Mostrando {filteredTenants.length} de {tenants.length} organizaciones</p>
                    <div className="flex space-x-1">
                        <button className="px-3 py-1 border border-gray-200 rounded bg-white text-xs disabled:opacity-50" disabled>Anterior</button>
                        <button className="px-3 py-1 border border-gray-200 rounded bg-white text-xs hover:bg-gray-50">Siguiente</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: string }) {
    const styles: any = {
        'ACTIVE': { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: <CheckBadgeIcon className="h-3 w-3" />, label: 'Activo' },
        'TRIAL': { bg: 'bg-blue-50', text: 'text-blue-700', icon: <FunnelIcon className="h-3 w-3" />, label: 'Prueba' },
        'PAST_DUE': { bg: 'bg-rose-50', text: 'text-rose-700', icon: <ExclamationCircleIcon className="h-3 w-3" />, label: 'Mora' },
        'SUSPENDED': { bg: 'bg-gray-50', text: 'text-gray-700', icon: <PauseCircleIcon className="h-3 w-3" />, label: 'Suspendido' }
    };

    const style = styles[status] || styles['ACTIVE'];

    return (
        <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${style.bg} ${style.text}`}>
            {style.icon}
            <span>{style.label}</span>
        </span>
    );
}
