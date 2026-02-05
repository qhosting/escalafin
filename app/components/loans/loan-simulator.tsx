'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, DollarSign, Calendar, Info, RefreshCw } from 'lucide-react';
import { calculateLoanDetails, LoanCalculationConfig } from '@/lib/loan-calculations';
import { toast } from 'sonner';

export function LoanSimulator() {
    const [principalAmount, setPrincipalAmount] = useState<string>('5000');
    const [calculationType, setCalculationType] = useState<string>('TARIFA_FIJA');
    const [numberOfPayments, setNumberOfPayments] = useState<string>('16');
    const [paymentFrequency, setPaymentFrequency] = useState<string>('SEMANAL');
    const [annualInterestRate, setAnnualInterestRate] = useState<string>('15');
    const [config, setConfig] = useState<LoanCalculationConfig | null>(null);
    const [results, setResults] = useState<any>(null);
    const [loadingConfig, setLoadingConfig] = useState(false);

    // Cargar configuración de tarifas
    const fetchConfig = async () => {
        try {
            setLoadingConfig(true);
            const response = await fetch('/api/admin/config/loans');
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
            }
        } catch (error) {
            console.error('Error fetching loan config:', error);
        } finally {
            setLoadingConfig(false);
        }
    };

    useEffect(() => {
        fetchConfig();
    }, []);

    // Recalcular cuando cambian los inputs
    useEffect(() => {
        calculate();
    }, [principalAmount, calculationType, numberOfPayments, paymentFrequency, annualInterestRate, config]);

    const calculate = () => {
        const amount = parseFloat(principalAmount);
        const payments = parseInt(numberOfPayments);
        const rate = parseFloat(annualInterestRate);

        if (isNaN(amount) || amount <= 0 || isNaN(payments) || payments <= 0) {
            setResults(null);
            return;
        }

        try {
            const details = calculateLoanDetails({
                loanCalculationType: calculationType as any,
                principalAmount: amount,
                numberOfPayments: payments,
                paymentFrequency: paymentFrequency as any,
                annualInterestRate: rate,
                startDate: new Date(),
                // Pasamos la config dinámica si existe
                ...(config && { config } as any)
            });

            setResults(details);
        } catch (error) {
            console.error('Calculation error:', error);
            setResults(null);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Panel de Configuración */}
            <Card className="lg:col-span-1 shadow-md border-t-4 border-t-primary">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Calculator className="h-5 w-5 text-primary" />
                        Configuración
                    </CardTitle>
                    <CardDescription>
                        Ajusta los parámetros para simular el préstamo
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Monto Principal</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="amount"
                                type="number"
                                className="pl-9"
                                value={principalAmount}
                                onChange={(e) => setPrincipalAmount(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Sistema de Cálculo</Label>
                        <Select value={calculationType} onValueChange={setCalculationType}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="TARIFA_FIJA">Tarifa Fija (Escalonada)</SelectItem>
                                <SelectItem value="INTERES_SEMANAL">Interés Semanal Fijo</SelectItem>
                                <SelectItem value="INTERES">Interés Tradicional (Amortización)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Frecuencia</Label>
                            <Select value={paymentFrequency} onValueChange={setPaymentFrequency}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="SEMANAL">Semanal</SelectItem>
                                    <SelectItem value="CATORCENAL">Catorcenal</SelectItem>
                                    <SelectItem value="QUINCENAL">Quincenal</SelectItem>
                                    <SelectItem value="MENSUAL">Mensual</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Número de Pagos</Label>
                            <Input
                                type="number"
                                value={numberOfPayments}
                                onChange={(e) => setNumberOfPayments(e.target.value)}
                            />
                        </div>
                    </div>

                    {calculationType === 'INTERES' && (
                        <div className="space-y-2">
                            <Label>Tasa Anual (%)</Label>
                            <Input
                                type="number"
                                value={annualInterestRate}
                                onChange={(e) => setAnnualInterestRate(e.target.value)}
                            />
                        </div>
                    )}

                    <Button
                        variant="outline"
                        className="w-full mt-4"
                        onClick={fetchConfig}
                        disabled={loadingConfig}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${loadingConfig ? 'animate-spin' : ''}`} />
                        Sincronizar Tarifas
                    </Button>
                </CardContent>
            </Card>

            {/* Panel de Resultados */}
            <Card className="lg:col-span-2 shadow-lg overflow-hidden border-none bg-gradient-to-br from-slate-50 to-white">
                <CardHeader className="bg-primary/5 border-b">
                    <CardTitle className="text-xl">Resumen de Simulación</CardTitle>
                    <CardDescription>
                        Basado en el sistema de {calculationType.replace('_', ' ')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    {results ? (
                        <div className="space-y-8">
                            {/* KPIs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-6 bg-white rounded-xl shadow-sm border flex flex-col items-center justify-center text-center">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Monto de cada pago</p>
                                    <p className="text-4xl font-extrabold text-primary">
                                        {formatCurrency(results.paymentAmount)}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        {numberOfPayments} pagos {paymentFrequency.toLowerCase()}es
                                    </p>
                                </div>
                                <div className="p-6 bg-white rounded-xl shadow-sm border flex flex-col items-center justify-center text-center">
                                    <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">Total a pagar</p>
                                    <p className="text-4xl font-extrabold text-slate-900">
                                        {formatCurrency(results.totalAmount)}
                                    </p>
                                    <p className="text-xs text-green-600 font-medium mt-2">
                                        Fin de préstamos: {results.endDate.toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Detalles Adicionales */}
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="p-4 bg-blue-50/50 rounded-lg border border-blue-100">
                                    <p className="text-xs font-semibold text-blue-700 uppercase mb-1">Costo Financiero</p>
                                    <p className="text-lg font-bold text-blue-900">
                                        {formatCurrency(results.totalAmount - parseFloat(principalAmount))}
                                    </p>
                                </div>
                                <div className="p-4 bg-purple-50/50 rounded-lg border border-purple-100">
                                    <p className="text-xs font-semibold text-purple-700 uppercase mb-1">Tasa Efectiva</p>
                                    <p className="text-lg font-bold text-purple-900">
                                        {results.effectiveRate ? `${results.effectiveRate}%` : 'N/A'}
                                    </p>
                                </div>
                                <div className="p-4 bg-orange-50/50 rounded-lg border border-orange-100">
                                    <p className="text-xs font-semibold text-orange-700 uppercase mb-1">Interés Semanal</p>
                                    <p className="text-lg font-bold text-orange-900">
                                        {results.weeklyInterest ? formatCurrency(results.weeklyInterest) : 'Prorrateado'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-amber-50 rounded-lg p-4 border border-amber-200 flex gap-3">
                                <Info className="h-5 w-5 text-amber-600 shrink-0" />
                                <p className="text-sm text-amber-800">
                                    Esta es una simulación informativa. Los montos finales pueden variar según la fecha exacta de desembolso y políticas de crédito vigentes.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center text-center p-8 text-muted-foreground">
                            <Calculator className="h-12 w-12 mb-4 opacity-20" />
                            <p>Ingresa parámetros válidos para ver la simulación</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
