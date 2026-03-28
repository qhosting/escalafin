
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
    ChevronRight,
    Search
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

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
            currency: 'MXN'
        }).format(amount);
    };

    const handleDownloadPDF = async () => {
        try {
            setDownloadingPDF(true);
            toast.info('Generando PDF, un momento...');

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
        toast.success('Abriendo previsualización...');
    };

    const handleShareWhatsApp = () => {
        const clientName = `${loan.client.firstName} ${loan.client.lastName}`;
        const nextPayment = loan.amortizationSchedule?.find(s => !s.isPaid);

        let message = `*ESTADO DE CUENTA - ESCALAFIN*\n\n`;
        message += `Hola ${clientName}, adjunto el resumen de tu crédito:\n\n`;
        message += `📌 *Préstamo:* ${loan.loanNumber}\n`;
        message += `💰 *Monto Original:* ${formatCurrency(loan.principalAmount)}\n`;
        message += `📉 *Saldo Pendiente:* ${formatCurrency(loan.balanceRemaining)}\n`;
        message += `✅ *Estatus:* ${loan.status === 'ACTIVE' ? 'Activo' : loan.status}\n\n`;

        if (nextPayment) {
            message += `🗓️ *Próximo Pago:* ${format(new Date(nextPayment.paymentDate), 'dd/MM/yyyy')}\n`;
            message += `💵 *Monto:* ${formatCurrency(Number(nextPayment.totalPayment))}\n\n`;
        }

        message += `Para más detalles, contacta a tu asesor.`;

        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${loan.client.phone.replace(/\D/g, '')}?text=${encodedMessage}`;

        window.open(whatsappUrl, '_blank');
        toast.success('Abriendo WhatsApp...');
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[550px] rounded-[2.5rem] p-0 overflow-hidden border-0 shadow-2xl">
                <DialogHeader className="p-8 bg-blue-600 text-white relative">
                    <div className="absolute top-[-20%] right-[-10%] w-60 h-60 bg-white/10 rounded-full blur-3xl" />
                    <div className="flex items-center gap-4 mb-2 relative z-10">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                           <FileText className="h-7 w-7 text-white" />
                        </div>
                        <div className="space-y-1">
                           <DialogTitle className="text-3xl font-black tracking-tight leading-none uppercase italic">Estado de Cuenta</DialogTitle>
                           <DialogDescription className="text-blue-100 font-bold opacity-80">Gestione la información financiera del préstamo {loan.loanNumber}</DialogDescription>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-8 space-y-8 bg-white dark:bg-gray-950">
                    {/* Resumen Premium */}
                    <Card className="border-none bg-blue-50/50 dark:bg-blue-900/10 rounded-3xl p-6 shadow-sm ring-1 ring-blue-100/50">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Cliente</span>
                                <h4 className="text-lg font-black text-slate-900 leading-tight">
                                    {loan.client.firstName} {loan.client.lastName}
                                </h4>
                            </div>
                            <div className="space-y-1 text-right">
                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest block">Saldo Pendiente</span>
                                <h4 className="text-2xl font-black text-blue-700 tracking-tighter">
                                    {formatCurrency(loan.balanceRemaining)}
                                </h4>
                            </div>
                        </div>
                        <Separator className="my-4 opacity-50 bg-blue-200" />
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                               <Calendar className="h-4 w-4 text-blue-500" />
                               <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">Ult. Actualización: {format(new Date(), 'dd/MMM/yyyy', { locale: es })}</span>
                           </div>
                           <Badge className="bg-green-100 text-green-700 font-black text-[9px] uppercase tracking-widest">ACTIVO</Badge>
                        </div>
                    </Card>

                    {/* Action Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Button
                            variant="outline"
                            className="h-28 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-slate-50 border-gray-100 shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97] group bg-white"
                            onClick={handleViewPDF}
                        >
                            <div className="p-3 bg-blue-50 group-hover:bg-blue-600 rounded-2xl group-hover:rotate-6 transition-all">
                               <Eye className="h-6 w-6 text-blue-600 group-hover:text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Ver PDF</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-28 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-slate-50 border-gray-100 shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97] group bg-white"
                            onClick={handleDownloadPDF}
                            disabled={downloadingPDF}
                        >
                            <div className="p-3 bg-indigo-50 group-hover:bg-indigo-600 rounded-2xl group-hover:rotate-[-6deg] transition-all">
                               {downloadingPDF ? (
                                   <Loader2 className="h-6 w-6 text-indigo-600 group-hover:text-white animate-spin" />
                               ) : (
                                   <Download className="h-6 w-6 text-indigo-600 group-hover:text-white" />
                               )}
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">Bajar PDF</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-28 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-green-50 border-gray-100 shadow-sm transition-all hover:scale-[1.03] active:scale-[0.97] group bg-white hover:border-green-100"
                            onClick={handleShareWhatsApp}
                        >
                            <div className="p-3 bg-green-50 group-hover:bg-green-600 rounded-2xl group-hover:rotate-6 transition-all">
                               <MessageCircle className="h-6 w-6 text-green-600 group-hover:text-white" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">WhatsApp</span>
                        </Button>
                    </div>
                </div>

                <DialogFooter className="p-8 border-t bg-gray-50/50 flex flex-col sm:flex-row items-center gap-6 justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest max-w-[200px]">
                           Reporte certificado por EscalaFin v2.71
                        </p>
                    </div>
                    <Button 
                       variant="ghost" 
                       className="font-black text-xs uppercase tracking-widest hover:bg-white rounded-xl h-12"
                       onClick={() => onOpenChange(false)}
                    >
                        Cerrar Ventana
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
