
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { 
    ShieldAlert, 
    RefreshCw, 
    CheckCircle2, 
    AlertTriangle,
    ArrowRight
} from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

export function CierrePenalizaciones() {
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [result, setResult] = useState<{ count: number; message: string } | null>(null);

    const handleExecuteClosure = async () => {
        try {
            setLoading(true);
            const response = await fetch('/api/admin/operations/closure', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Error al ejecutar el cierre');
            }

            setResult({
                count: data.count,
                message: data.message
            });
            toast.success(data.message);
        } catch (error: any) {
            console.error('Error in closure:', error);
            toast.error(error.message || 'Error al procesar el cierre');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) setResult(null);
        }}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    className="group h-auto py-4 px-6 rounded-3xl border-2 border-orange-100 hover:border-orange-500 hover:bg-orange-50 transition-all flex flex-col items-center gap-2 bg-white dark:bg-gray-900 shadow-sm"
                >
                    <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-2xl group-hover:rotate-12 transition-transform">
                        <ShieldAlert className="h-6 w-6 text-orange-600" />
                    </div>
                    <div className="text-center">
                        <span className="block text-xs font-black uppercase text-orange-700 tracking-widest">Ejecutar</span>
                        <span className="block text-sm font-black text-slate-800 dark:text-gray-200">Cierre de Día</span>
                    </div>
                </Button>
            </DialogTrigger>
            
            <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-0 overflow-hidden border-0 shadow-2xl">
                <DialogHeader className="p-8 bg-orange-600 text-white relative">
                    <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                    <div className="flex items-center gap-4 mb-2 relative z-10">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                           <ShieldAlert className="h-7 w-7 text-white" />
                        </div>
                        <div className="space-y-1">
                           <DialogTitle className="text-3xl font-black tracking-tight leading-none uppercase italic">Cierre Operativo</DialogTitle>
                           <DialogDescription className="text-orange-100 font-bold opacity-80 underline underline-offset-4 decoration-orange-300">Generación masiva de penalizaciones de $200</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-6 bg-white dark:bg-gray-950">
                    {!result ? (
                        <div className="space-y-4">
                            <div className="p-6 bg-orange-50 dark:bg-orange-900/10 rounded-3xl border border-orange-100 dark:border-orange-800 space-y-3">
                                <div className="flex items-start gap-3">
                                    <AlertTriangle className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                                    <p className="text-sm font-bold text-orange-800 dark:text-orange-300">
                                        Esta acción buscará todos los préstamos con pagos vencidos al día de hoy y generará una penalización de $200 por cada pago atrasado (máximo $800 por semana).
                                    </p>
                                </div>
                                <ul className="text-xs space-y-2 text-slate-500 font-medium ml-8 list-disc">
                                    <li>Solo afecta clientes con estado ACTIVO.</li>
                                    <li>No duplica multas si ya se aplicaron hoy.</li>
                                    <li>Respeta el tope de $800 por cuota.</li>
                                </ul>
                            </div>
                            
                            <p className="text-center text-sm font-black text-slate-400 uppercase tracking-widest pt-2">
                                ¿Desea proceder con el cierre masivo?
                            </p>
                        </div>
                    ) : (
                        <div className="text-center space-y-6 animate-in zoom-in-95 duration-300">
                            <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                                <CheckCircle2 className="h-10 w-10 text-green-600" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase italic">¡Cierre Exitoso!</h3>
                                <div className="flex justify-center">
                                    <Badge className="bg-green-600 text-white font-black text-lg px-4 py-1 rounded-xl">
                                        {result.count} Multas Generadas
                                    </Badge>
                                </div>
                                <p className="text-sm font-medium text-slate-500 leading-relaxed max-w-[280px] mx-auto">
                                    El sistema procesó correctamente todos los vencimientos y aplicó los cargos de $200 correspondientes.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-8 border-t bg-gray-50/50 flex flex-col sm:flex-row items-center gap-4 justify-between">
                    {!result ? (
                        <>
                            <Button 
                                variant="ghost" 
                                className="font-black text-xs uppercase tracking-widest hover:bg-white rounded-xl h-12"
                                onClick={() => setIsOpen(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                className="bg-orange-600 hover:bg-orange-700 text-white font-black text-xs uppercase tracking-widest rounded-xl h-12 px-8 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
                                onClick={handleExecuteClosure}
                                disabled={loading}
                            >
                                {loading ? (
                                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                                ) : (
                                    <ArrowRight className="h-4 w-4 mr-2" />
                                )}
                                Confirmar y Ejecutar
                            </Button>
                        </>
                    ) : (
                        <Button 
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl h-12"
                            onClick={() => setIsOpen(false)}
                        >
                            Finalizar Proceso
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
