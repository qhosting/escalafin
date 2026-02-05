'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, Plus, Trash2, RotateCcw, Loader2, DollarSign, Percent } from 'lucide-react';
import { LoanTariffConfig, DEFAULT_LOAN_TARIFFS } from '@/lib/config-service';
import { toast } from 'sonner';

export default function LoanConfigPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<LoanTariffConfig>(DEFAULT_LOAN_TARIFFS);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/config/loans');
            if (response.ok) {
                const data = await response.json();
                setConfig(data);
            }
        } catch (error) {
            console.error('Error loading config:', error);
            toast.error('Error al cargar la configuración');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const response = await fetch('/api/admin/config/loans', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(config)
            });

            if (response.ok) {
                toast.success('Configuración guardada exitosamente');
            } else {
                throw new Error('Error al guardar');
            }
        } catch (error) {
            toast.error('Error al guardar la configuración');
        } finally {
            setSaving(false);
        }
    };

    const resetToDefaults = () => {
        if (confirm('¿Estás seguro de restablecer los valores por defecto?')) {
            setConfig(DEFAULT_LOAN_TARIFFS);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 max-w-5xl space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Configuración de Préstamos</h1>
                    <p className="text-muted-foreground">Adminitra las tarifas fijas y tasas de interés dinámicas</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={resetToDefaults}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Por Defecto
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar Cambios
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="fixed" className="w-full">
                <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
                    <TabsTrigger value="fixed">Tarifa Fija</TabsTrigger>
                    <TabsTrigger value="weekly">Interés Semanal</TabsTrigger>
                </TabsList>

                {/* TAB TARIFA FIJA */}
                <TabsContent value="fixed" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Niveles de Tarifa (Tiers)</CardTitle>
                            <CardDescription>Escalona los pagos según el monto solicitado</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 font-semibold text-sm text-muted-foreground px-2">
                                <div>Monto Máximo</div>
                                <div>Pago por Cuota</div>
                                <div></div>
                            </div>
                            {config.fixedFee.tiers.map((tier, idx) => (
                                <div key={idx} className="grid grid-cols-3 gap-4 items-center">
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            className="pl-9"
                                            value={tier.maxAmount}
                                            onChange={(e) => {
                                                const newTiers = [...config.fixedFee.tiers];
                                                newTiers[idx].maxAmount = Number(e.target.value);
                                                setConfig({ ...config, fixedFee: { ...config.fixedFee, tiers: newTiers } });
                                            }}
                                        />
                                    </div>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            type="number"
                                            className="pl-9"
                                            value={tier.paymentAmount}
                                            onChange={(e) => {
                                                const newTiers = [...config.fixedFee.tiers];
                                                newTiers[idx].paymentAmount = Number(e.target.value);
                                                setConfig({ ...config, fixedFee: { ...config.fixedFee, tiers: newTiers } });
                                            }}
                                        />
                                    </div>
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                                        const newTiers = config.fixedFee.tiers.filter((_, i) => i !== idx);
                                        setConfig({ ...config, fixedFee: { ...config.fixedFee, tiers: newTiers } });
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="secondary" size="sm" onClick={() => {
                                const newTiers = [...config.fixedFee.tiers, { maxAmount: 0, paymentAmount: 0 }];
                                setConfig({ ...config, fixedFee: { ...config.fixedFee, tiers: newTiers } });
                            }}>
                                <Plus className="h-4 w-4 mr-2" /> Añadir Nivel
                            </Button>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Cálculo Excedente</CardTitle>
                            <CardDescription>Reglas para montos que superan los niveles definidos</CardDescription>
                        </CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Monto Base</Label>
                                <Input
                                    type="number"
                                    value={config.fixedFee.overLimit.baseAmount}
                                    onChange={(e) => setConfig({ ...config, fixedFee: { ...config.fixedFee, overLimit: { ...config.fixedFee.overLimit, baseAmount: Number(e.target.value) } } })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Pago Base</Label>
                                <Input
                                    type="number"
                                    value={config.fixedFee.overLimit.basePayment}
                                    onChange={(e) => setConfig({ ...config, fixedFee: { ...config.fixedFee, overLimit: { ...config.fixedFee.overLimit, basePayment: Number(e.target.value) } } })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Escalón Adicional ($)</Label>
                                <Input
                                    type="number"
                                    value={config.fixedFee.overLimit.additionalStep}
                                    onChange={(e) => setConfig({ ...config, fixedFee: { ...config.fixedFee, overLimit: { ...config.fixedFee.overLimit, additionalStep: Number(e.target.value) } } })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Tarifa p/ Escalón ($)</Label>
                                <Input
                                    type="number"
                                    value={config.fixedFee.overLimit.additionalFee}
                                    onChange={(e) => setConfig({ ...config, fixedFee: { ...config.fixedFee, overLimit: { ...config.fixedFee.overLimit, additionalFee: Number(e.target.value) } } })}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* TAB INTERÉS SEMANAL */}
                <TabsContent value="weekly" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Tabuladores de Interés</CardTitle>
                            <CardDescription>Interés en pesos ($) según el monto solicitado</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-3 gap-4 font-semibold text-sm text-muted-foreground px-2">
                                <div>Monto</div>
                                <div>Interés Semanal ($)</div>
                                <div></div>
                            </div>
                            {config.weeklyInterest.rates.map((rate, idx) => (
                                <div key={idx} className="grid grid-cols-3 gap-4 items-center">
                                    <Input
                                        type="number"
                                        value={rate.amount}
                                        onChange={(e) => {
                                            const newRates = [...config.weeklyInterest.rates];
                                            newRates[idx].amount = Number(e.target.value);
                                            setConfig({ ...config, weeklyInterest: { ...config.weeklyInterest, rates: newRates } });
                                        }}
                                    />
                                    <Input
                                        type="number"
                                        value={rate.interest}
                                        onChange={(e) => {
                                            const newRates = [...config.weeklyInterest.rates];
                                            newRates[idx].interest = Number(e.target.value);
                                            setConfig({ ...config, weeklyInterest: { ...config.weeklyInterest, rates: newRates } });
                                        }}
                                    />
                                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => {
                                        const newRates = config.weeklyInterest.rates.filter((_, i) => i !== idx);
                                        setConfig({ ...config, weeklyInterest: { ...config.weeklyInterest, rates: newRates } });
                                    }}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                            <Button variant="secondary" size="sm" onClick={() => {
                                const newRates = [...config.weeklyInterest.rates, { amount: 0, interest: 0 }];
                                setConfig({ ...config, weeklyInterest: { ...config.weeklyInterest, rates: newRates } });
                            }}>
                                <Plus className="h-4 w-4 mr-2" /> Añadir Rango
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
