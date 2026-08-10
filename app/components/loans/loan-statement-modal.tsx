'use client';

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    FileText,
    MessageCircle,
    Download,
    Loader2,
    Calendar,
    DollarSign,
    User,
    Eye,
    TrendingUp,
    ShieldCheck,
    CheckCircle2
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface LoanStatementModalProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    loan: {
        id: string;
        loanNumber: string;
        principalAmount: number;
        balanceRemaining: number;
        status: string;
        client: {
            firstName: string;
            lastName: string;
            phone: string;
        };
        payments?: any[];
        amortizationSchedule?: any[];
    } | null;
}

export function LoanStatementModal({
    isOpen,
    onOpenChange,
    loan
}: LoanStatementModalProps) {
    const [downloadingPDF, setDownloadingPDF] = useState(false);
    
    if (!loan) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const principal = Number(loan.principalAmount || 0);
    const balance = Number(loan.balanceRemaining || 0);
    const paidTotal = Math.max(0, principal - balance);
    const progressPercent = principal > 0 ? Math.min(100, Math.max(0, (paidTotal / principal) * 100)) : 0;
    const nextPayment = loan.amortizationSchedule?.find(s => !s.isPaid);

    const handleDownloadPDF = async () => {
        try {
            setDownloadingPDF(true);
            toast.info('Generando Estado de Cuenta en PDF...');

            const response = await fetch(`/api/loans/${loan.id}/statement`, {
                method: 'GET',
                credentials: 'include', 
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || `Error ${response.status}`);
            }

            const blob = await response.blob();
            const url = URL.createObjectURL(blob);

            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `Estado_Cuenta_${loan.loanNumber}.pdf`;
            document.body.appendChild(anchor);
            anchor.click();
            document.body.removeChild(anchor);
            URL.revokeObjectURL(url);

            toast.success('PDF descargado correctamente');
        } catch (error: any) {
            console.error('Error descargando PDF:', error);
            toast.error(`Error al descargar: ${error.message || 'Intenta de nuevo'}`);
        } finally {
            setDownloadingPDF(false);
        }
    };

    const handleViewPDF = () => {
        const url = `/api/loans/${loan.id}/statement`;
        window.open(url, '_blank');
        toast.success('Abriendo Estado de Cuenta...');
    };

    const handleShareWhatsApp = () => {
        const clientName = `${loan.client.firstName} ${loan.client.lastName}`;

        let message = `*ESTADO DE CUENTA - ESCALAFIN*\n\n`;
        message += `Hola ${clientName}, te compartimos el resumen oficial de tu crédito:\n\n`;
        message += `📌 *Préstamo:* ${loan.loanNumber}\n`;
        message += `💵 *Monto Otorgado:* ${formatCurrency(principal)}\n`;
        message += `✅ *Abonado a la fecha:* ${formatCurrency(paidTotal)}\n`;
        message += `📉 *Saldo Pendiente:* ${formatCurrency(balance)}\n`;
        message += `📊 *Progreso de Pago:* ${progressPercent.toFixed(1)}%\n\n`;

        if (nextPayment) {
            message += `🗓️ *Próximo Pago:* ${format(new Date(nextPayment.paymentDate), 'dd/MM/yyyy')}\n`;
            message += `💰 *Monto a Pagar:* ${formatCurrency(Number(nextPayment.totalPayment))}\n\n`;
        }

        message += `Cualquier duda o aclaración estamos a tus órdenes.`;

        const encodedMessage = encodeURIComponent(message);
        const cleanPhone = loan.client.phone ? loan.client.phone.replace(/\D/g, '') : '';
        const whatsappUrl = cleanPhone 
            ? `https://wa.me/52${cleanPhone}?text=${encodedMessage}`
            : `https://wa.me/?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
        toast.success('Abriendo WhatsApp...');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[580px] rounded-[2.5rem] p-0 overflow-hidden border-0 shadow-2xl">
                {/* Header Banner */}
                <DialogHeader className="p-8 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-900 text-white relative">
                    <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-blue-500/10 rounded-full blur-3xl" />
                    <div className="flex items-center gap-4 mb-2 relative z-10">
                        <div className="bg-blue-600/30 p-3.5 rounded-2xl backdrop-blur-md border border-blue-400/20">
                           <FileText className="h-7 w-7 text-blue-300" />
                        </div>
                        <div className="space-y-1">
                           <DialogTitle className="text-2xl font-black tracking-tight leading-none uppercase italic">Estado de Cuenta</DialogTitle>
                           <DialogDescription className="text-blue-200 text-xs font-semibold opacity-90">
                              Resumen financiero oficial del préstamo <span className="text-white font-bold">{loan.loanNumber}</span>
                           </DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 md:p-8 space-y-6 bg-white dark:bg-gray-950">
                    {/* Tarjeta de Resumen Financiero */}
                    <Card className="border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 rounded-3xl p-6 shadow-sm">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Acreditado</span>
                                <h4 className="text-base font-black text-slate-900 dark:text-white leading-tight">
                                    {loan.client.firstName} {loan.client.lastName}
                                </h4>
                                <p className="text-xs text-slate-500 font-medium">{loan.client.phone || 'Sin teléfono'}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Saldo Pendiente</span>
                                <h4 className="text-2xl font-black text-blue-600 dark:text-blue-400 tracking-tighter">
                                    {formatCurrency(balance)}
                                </h4>
                            </div>
                        </div>

                        {/* Barra de Progreso */}
                        <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-center text-xs font-bold">
                                <span className="text-slate-500">Monto Otorgado: {formatCurrency(principal)}</span>
                                <span className="text-emerald-600">{progressPercent.toFixed(1)}% Pagado</span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                                <div 
                                    className="bg-emerald-500 h-2.5 rounded-full transition-all duration-500" 
                                    style={{ width: `${progressPercent}%` }}
                                />
                            </div>
                        </div>

                        {/* Detalle Próximo Pago si existe */}
                        {nextPayment && (
                            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-blue-600" />
                                    <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                                        Próximo Vencimiento: <strong className="text-slate-900 dark:text-white">{format(new Date(nextPayment.paymentDate), 'dd/MM/yyyy')}</strong>
                                    </span>
                                </div>
                                <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-bold text-xs rounded-xl">
                                    {formatCurrency(Number(nextPayment.totalPayment))}
                                </Badge>
                            </div>
                        )}
                    </Card>

                    {/* Botones de Acción */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Button
                            variant="outline"
                            className="h-24 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-blue-50 hover:border-blue-200 shadow-sm transition-all group bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            onClick={handleViewPDF}
                        >
                            <div className="p-2.5 bg-blue-50 dark:bg-blue-950 group-hover:bg-blue-600 rounded-xl transition-all">
                               <Eye className="h-5 w-5 text-blue-600 group-hover:text-white" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Ver PDF</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-24 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-indigo-50 hover:border-indigo-200 shadow-sm transition-all group bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            onClick={handleDownloadPDF}
                            disabled={downloadingPDF}
                        >
                            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 group-hover:bg-indigo-600 rounded-xl transition-all">
                               {downloadingPDF ? (
                                   <Loader2 className="h-5 w-5 text-indigo-600 group-hover:text-white animate-spin" />
                               ) : (
                                   <Download className="h-5 w-5 text-indigo-600 group-hover:text-white" />
                               )}
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Bajar PDF</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-24 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-emerald-50 hover:border-emerald-200 shadow-sm transition-all group bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
                            onClick={handleShareWhatsApp}
                        >
                            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950 group-hover:bg-emerald-600 rounded-xl transition-all">
                               <MessageCircle className="h-5 w-5 text-emerald-600 group-hover:text-white" />
                            </div>
                            <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">Compartir WhatsApp</span>
                        </Button>
                    </div>
                </div>

                <DialogFooter className="p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                           Verificado por EscalaFin Core
                        </p>
                    </div>
                    <Button 
                       variant="ghost" 
                       className="font-bold text-xs rounded-xl h-10 px-4"
                       onClick={() => onOpenChange(false)}
                    >
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
