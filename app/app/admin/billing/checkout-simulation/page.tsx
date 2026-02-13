'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function CheckoutSimulationPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const transactionId = searchParams.get('transactionId');
    const planId = searchParams.get('planId');
    const [status, setStatus] = useState<'processing' | 'success' | 'failed'>('processing');

    useEffect(() => {
        if (!transactionId || !planId) {
            setStatus('failed');
            return;
        }

        // Simulate Openpay processing time
        const processPayment = async () => {
            try {
                // Call internal API to "Confirm" the transaction (Simulating webhook callback)
                const res = await fetch('/api/admin/billing/confirm-simulation', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ transactionId, planId })
                });

                if (!res.ok) throw new Error('Error processing payment');

                setStatus('success');
                toast.success('Pago procesado correctamente');

                // Redirect back to billing settings after 2s
                setTimeout(() => {
                    router.push('/admin/settings?tab=billing');
                }, 2000);
            } catch (error) {
                console.error(error);
                setStatus('failed');
                toast.error('Error al procesar el pago');
            }
        };

        // Start processing after mount
        const timeout = setTimeout(processPayment, 1500);
        return () => clearTimeout(timeout);
    }, [transactionId, planId, router]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <Card className="w-full max-w-md shadow-xl border-t-4 border-t-indigo-600">
                <CardContent className="pt-10 pb-8 px-8 text-center space-y-6">
                    {status === 'processing' && (
                        <>
                            <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto animate-pulse">
                                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Procesando Pago Seguro</h2>
                                <p className="text-gray-500 mt-2">Estamos conectando con Openpay...</p>
                            </div>
                        </>
                    )}

                    {status === 'success' && (
                        <>
                            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">¡Pago Exitoso!</h2>
                                <p className="text-gray-500 mt-2">Tu plan ha sido actualizado.</p>
                            </div>
                            <Button onClick={() => router.push('/admin/settings?tab=billing')} className="w-full bg-indigo-600 hover:bg-indigo-700">
                                Volver a Configuración
                            </Button>
                        </>
                    )}

                    {status === 'failed' && (
                        <>
                            <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="h-8 w-8 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Error en el Pago</h2>
                                <p className="text-gray-500 mt-2">No se pudo procesar la transacción.</p>
                            </div>
                            <Button variant="outline" onClick={() => router.push('/admin/settings?tab=billing')} className="w-full">
                                Cancelar y Volver
                            </Button>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
