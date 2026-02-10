
'use client';

import React from 'react';
import {
    CheckIcon,
    XMarkIcon,
    SparklesIcon
} from '@heroicons/react/24/solid';

interface Plan {
    id: string;
    name: string;
    displayName: string;
    priceMonthly: number;
    description: string;
    features: string[];
    isPopular?: boolean;
}

interface PlanSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    plans: Plan[];
    currentPlanId: string;
    onSelectPlan: (planId: string) => void;
    isLoading?: boolean;
}

export function PlanSelectionModal({
    isOpen,
    onClose,
    plans,
    currentPlanId,
    onSelectPlan,
    isLoading
}: PlanSelectionModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-gray-50 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="px-8 py-6 border-b bg-white flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">Mejora tu Plan</h2>
                        <p className="text-gray-500 text-sm">Elige el plan que mejor se adapte al crecimiento de tu empresa.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <XMarkIcon className="h-6 w-6 text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative rounded-2xl p-6 flex flex-col transition-all duration-300 ${plan.id === currentPlanId
                                        ? 'bg-white border-2 border-indigo-600 shadow-lg shadow-indigo-100'
                                        : 'bg-white border border-gray-100 hover:border-indigo-200 hover:shadow-xl hover:shadow-gray-100'
                                    }`}
                            >
                                {plan.isPopular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full shadow-lg flex items-center gap-1">
                                        <SparklesIcon className="w-3 h-3" /> Popular
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-lg font-bold text-gray-900">{plan.displayName}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{plan.description}</p>
                                    <div className="mt-4 flex items-baseline">
                                        <span className="text-3xl font-black text-gray-900">${plan.priceMonthly}</span>
                                        <span className="text-gray-400 text-sm ml-1">/mes</span>
                                    </div>
                                </div>

                                <div className="flex-1 space-y-3 mb-8">
                                    {plan.features.map((feature, idx) => (
                                        <div key={idx} className="flex items-start gap-2">
                                            <div className="mt-1 bg-indigo-100 rounded-full p-0.5">
                                                <CheckIcon className="h-3 w-3 text-indigo-600" />
                                            </div>
                                            <span className="text-xs text-gray-600">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    onClick={() => onSelectPlan(plan.id)}
                                    disabled={plan.id === currentPlanId || isLoading}
                                    className={`w-full py-3 rounded-xl text-sm font-bold transition-all ${plan.id === currentPlanId
                                            ? 'bg-gray-100 text-gray-400 cursor-default'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-100 active:scale-[0.98]'
                                        }`}
                                >
                                    {plan.id === currentPlanId
                                        ? 'Plan Actual'
                                        : isLoading ? 'Procesando...' : `Elegir ${plan.displayName}`
                                    }
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-8 py-4 bg-gray-100 border-t text-center text-xs text-gray-400">
                    Cambios de plan se aplican inmediatamente. Cargos prorrateados aparecerán en tu próxima factura.
                </div>
            </div>
        </div>
    );
}

