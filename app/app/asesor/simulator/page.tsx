import React from 'react';
import { LoanSimulator } from '@/components/loans/loan-simulator';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Calculator } from 'lucide-react';

export default function SimulatorPage() {
    return (
        <div className="container mx-auto py-8 px-4 space-y-8">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight">Simulador de Préstamos</h1>
                <p className="text-muted-foreground">
                    Herramienta de apoyo para asesores. Proyecta pagos y costos financieros al instante.
                </p>
            </div>

            <LoanSimulator />

            <Card className="bg-slate-900 text-white border-none">
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        Guía de Uso para Asesores
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-slate-300">
                    <div className="space-y-2">
                        <p className="font-semibold text-white">1. Define el Monto</p>
                        <p>Ingresa el capital solicitado por el cliente. El sistema ajustará las tarifas automáticamente si usas el sistema de Tarifa Fija.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-semibold text-white">2. Sistema de Cálculo</p>
                        <p>Usa <strong>Tarifa Fija</strong> para préstamos exprés escalonados o <strong>Interés Semanal</strong> para créditos con tasa fija sobre capital.</p>
                    </div>
                    <div className="space-y-2">
                        <p className="font-semibold text-white">3. Frecuencia y Pagos</p>
                        <p>Asegúrate de que la frecuencia coincida con la capacidad de pago del cliente para reducir el riesgo de mora.</p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
