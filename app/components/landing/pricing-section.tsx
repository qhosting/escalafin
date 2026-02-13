'use client';

import useSWR from 'swr';
import { CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function PricingSection() {
    const { data: plans, isLoading } = useSWR('/api/public/plans', fetcher);

    if (isLoading) {
        return (
            <div className="py-20 flex justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
        );
    }

    // Filter active plans and sort by price
    const activePlans = plans?.filter((p: any) => p.isActive && p.name !== 'legacy').sort((a: any, b: any) => Number(a.priceMonthly) - Number(b.priceMonthly)) || [];

    return (
        <section id="pricing-section" className="py-20 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center space-y-4 mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Planes Simples y Transparentes</h2>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Comienza gratis y escala según el crecimiento de tu negocio
                    </p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
                    {activePlans.map((plan: any) => (
                        <div key={plan.id} className={`
                            relative bg-white rounded-2xl shadow-xl flex flex-col p-8 transition-transform hover:-translate-y-1
                            ${plan.isPopular ? 'border-2 border-indigo-600 ring-4 ring-indigo-50' : 'border border-gray-100'}
                        `}>
                            {plan.isPopular && (
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide">
                                    Más Popular
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-2xl font-bold text-gray-900">{plan.displayName}</h3>
                                <p className="text-gray-500 mt-2">{plan.description || 'Para negocios en crecimiento'}</p>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-baseline">
                                    <span className="text-4xl font-extrabold text-gray-900">${Number(plan.priceMonthly).toLocaleString()}</span>
                                    <span className="text-gray-500 ml-2">/ mes</span>
                                </div>
                            </div>

                            <ul className="space-y-4 mb-8 flex-1">
                                {JSON.parse(plan.features || '[]').map((feature: string, idx: number) => (
                                    <li key={idx} className="flex items-start">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mr-3 flex-shrink-0" />
                                        <span className="text-gray-600">{feature}</span>
                                    </li>
                                ))}
                            </ul>

                            <Link href={`/auth/register-tenant?plan=${plan.name}`}>
                                <Button className={`w-full py-6 font-bold text-lg ${plan.isPopular ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gray-900 hover:bg-gray-800'}`}>
                                    Empezar Ahora <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
