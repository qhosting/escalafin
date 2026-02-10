'use client';

import React, { useState, useEffect } from 'react';
import {
    CheckIcon,
    CreditCardIcon,
    InboxArrowDownIcon,
    ArrowRightCircleIcon,
    LifebuoyIcon
} from '@heroicons/react/24/solid';
import { ShieldCheckIcon, SparklesIcon, CalendarDaysIcon } from '@heroicons/react/24/outline';

/**
 * Tenant Billing Portal
 * Página donde el cliente gestiona su propia suscripción, pagos y límites
 */
export default function BillingPortal() {
    const [subscription, setSubscription] = useState<any>(null);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchBillingData() {
            try {
                const response = await fetch('/api/billing/portal');
                if (response.ok) {
                    const data = await response.json();
                    // Consolidar datos de suscripción y uso en un solo estado
                    setSubscription({
                        ...data.subscription,
                        usage: data.usage
                    });
                    setHistory(data.history);
                }
            } catch (error) {
                console.error('Error loading billing data:', error);
            } finally {
                setLoading(false);
            }
        }
        fetchBillingData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8 py-4">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Suscripción y Pagos</h1>
                    <p className="text-gray-500 mt-1">Administra tu plan, métodos de pago y descarga tus facturas.</p>
                </div>
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg px-4 py-2 flex items-center space-x-2">
                    <SparklesIcon className="h-5 w-5 text-indigo-600" />
                    <span className="text-sm font-semibold text-indigo-700">Plan {subscription.plan}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column: Plan Details & Usage */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Active Plan Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="bg-indigo-600 px-6 py-6 text-white flex justify-between items-center">
                            <div>
                                <p className="text-indigo-100 text-xs font-bold uppercase tracking-wider">Tu Plan Actual</p>
                                <h2 className="text-2xl font-bold mt-1">{subscription.plan}</h2>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold">${subscription.amount.toLocaleString()} <small className="text-xs font-normal">{subscription.currency}/mes</small></p>
                                <p className="text-indigo-100 text-xs mt-1 italic">Facturado mensualmente</p>
                            </div>
                        </div>

                        <div className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <UsageProgress
                                    label="Usuarios"
                                    current={subscription.usage.users.current}
                                    limit={subscription.usage.users.limit}
                                    unit="users"
                                />
                                <UsageProgress
                                    label="Préstamos/mes"
                                    current={subscription.usage.loans.current}
                                    limit={subscription.usage.loans.limit}
                                    unit="créditos"
                                />
                                <UsageProgress
                                    label="Almacenamiento"
                                    current={subscription.usage.storage.current}
                                    limit={subscription.usage.storage.limit}
                                    unit="GB"
                                />
                            </div>

                            <div className="mt-8 pt-6 border-t border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                                <div className="flex items-center space-x-2 text-sm text-gray-500">
                                    <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                                    <span>Próximo cargo: <b>{new Date(subscription.nextBilling).toLocaleDateString()}</b></span>
                                </div>
                                <div className="flex space-x-3 w-full sm:w-auto">
                                    <button className="flex-1 sm:flex-none px-4 py-2 border border-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                                        Cancelar suscripción
                                    </button>
                                    <button className="flex-1 sm:flex-none px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold hover:bg-indigo-700 shadow-md shadow-indigo-100 transition-all flex items-center justify-center space-x-2">
                                        <ArrowRightCircleIcon className="h-4 w-4" />
                                        <span>Mejorar Plan</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Payment History */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-bold text-gray-800">Historial de Facturación</h3>
                            <button className="text-xs font-semibold text-indigo-600 hover:text-indigo-800">Ver historial completo</button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs text-gray-400 font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Fecha</th>
                                        <th className="px-6 py-4">Monto</th>
                                        <th className="px-6 py-4">Estado</th>
                                        <th className="px-6 py-4 text-right">Factura</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {history.map((inv) => (
                                        <tr key={inv.id} className="text-sm hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4 text-gray-600">{new Date(inv.date).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-semibold text-gray-900">${inv.amount.toLocaleString()} {subscription.currency}</td>
                                            <td className="px-6 py-4">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-emerald-50 text-emerald-700">
                                                    <CheckIcon className="h-3 w-3 mr-1" /> Pagado
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
                                                    <InboxArrowDownIcon className="h-5 w-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Right Column: Sidebar info */}
                <div className="space-y-6">

                    {/* Payment Method Card */}
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                        <h3 className="font-bold text-gray-800 mb-4 flex items-center space-x-2">
                            <CreditCardIcon className="h-5 w-5 text-gray-400" />
                            <span>Método de Pago</span>
                        </h3>
                        <div className="flex items-center space-x-4 p-4 rounded-xl border border-gray-100 bg-gray-50/50">
                            <div className="h-10 w-16 bg-white border border-gray-200 rounded flex items-center justify-center font-bold text-blue-800 italic">
                                VISA
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-bold text-gray-900">Visa terminada en 4242</p>
                                <p className="text-xs text-gray-500">Expira el 12/28</p>
                            </div>
                        </div>
                        <button className="w-full mt-4 py-2 border border-dashed border-gray-300 rounded-xl text-sm font-semibold text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-all">
                            Cambiar método de pago
                        </button>
                    </div>

                    {/* Promotion/Help Card */}
                    <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-2xl shadow-lg shadow-indigo-100 p-6 text-white overflow-hidden relative">
                        <ShieldCheckIcon className="h-32 w-32 absolute -right-8 -bottom-8 opacity-10" />
                        <h3 className="text-xl font-bold mb-2">¿Necesitas ayuda?</h3>
                        <p className="text-indigo-100 text-sm mb-6">Nuestro equipo de soporte está disponible 24/7 para ayudarte con tus dudas sobre facturación.</p>
                        <button className="w-full py-3 bg-white text-indigo-700 rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-50 transition-all flex items-center justify-center space-x-2">
                            <LifebuoyIcon className="h-5 w-5" />
                            <span>Hablar con Soporte</span>
                        </button>
                    </div>

                    <div className="px-2">
                        <p className="text-xs text-gray-400 text-center">
                            Al usar EscalaFin, aceptas nuestras <a href="#" className="underline">Condiciones de Servicio</a> y <a href="#" className="underline">Política de Privacidad</a>.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}

function UsageProgress({ label, current, limit, unit }: any) {
    const percentage = Math.min((current / limit) * 100, 100);
    const isHigh = percentage > 85;

    return (
        <div className="space-y-2">
            <div className="flex justify-between items-end">
                <span className="text-sm font-medium text-gray-600">{label}</span>
                <span className="text-xs text-gray-400">
                    <b className={isHigh ? 'text-rose-600' : 'text-gray-900'}>{current}</b>/{limit} {unit}
                </span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-1000 ${isHigh ? 'bg-rose-500' : 'bg-indigo-500'
                        }`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
}
