'use client';

import React from 'react';
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
    X,
    CheckCircle2,
    Calendar,
    DollarSign,
    User,
    ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

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
    if (!loan) return null;

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-MX', {
            style: 'currency',
            currency: 'MXN'
        }).format(amount);
    };

    const handleDownloadPDF = () => {
        window.open(`/api/loans/${loan.id}/statement`, '_blank');
        toast.success('Generando PDF...');
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
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-2xl font-bold">
                        <FileText className="h-6 w-6 text-blue-600" />
                        Estado de Cuenta
                    </DialogTitle>
                    <DialogDescription>
                        Vista rápida y opciones de envío para el préstamo {loan.loanNumber}
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-6 py-4">
                    {/* Resumen Card */}
                    <div className="bg-slate-50 border rounded-xl p-4 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-600">
                                <User className="h-4 w-4" />
                                <span className="text-sm font-medium">Cliente</span>
                            </div>
                            <span className="font-semibold text-slate-900">
                                {loan.client.firstName} {loan.client.lastName}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-600">
                                <DollarSign className="h-4 w-4" />
                                <span className="text-sm font-medium">Saldo Pendiente</span>
                            </div>
                            <span className="text-xl font-bold text-blue-700">
                                {formatCurrency(loan.balanceRemaining)}
                            </span>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-600">
                                <Calendar className="h-4 w-4" />
                                <span className="text-sm font-medium">Estatus</span>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full font-bold ${loan.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'
                                }`}>
                                {loan.status === 'ACTIVE' ? 'ACTIVO' : loan.status}
                            </span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <Button
                            variant="outline"
                            className="h-24 flex flex-col gap-2 hover:bg-slate-50 border-2"
                            onClick={handleDownloadPDF}
                        >
                            <Download className="h-6 w-6 text-blue-600" />
                            <span>Descargar PDF</span>
                        </Button>

                        <Button
                            variant="outline"
                            className="h-24 flex flex-col gap-2 hover:bg-green-50 hover:border-green-200 border-2"
                            onClick={handleShareWhatsApp}
                        >
                            <MessageCircle className="h-6 w-6 text-green-600" />
                            <span>Compartir WhatsApp</span>
                        </Button>
                    </div>
                </div>

                <DialogFooter className="flex sm:justify-between items-center sm:flex-row gap-4 border-t pt-4">
                    <p className="text-[10px] text-slate-500 italic max-w-[250px]">
                        El estado de cuenta PDF incluye el historial completo de pagos y tabla de amortización.
                    </p>
                    <Button variant="ghost" onClick={() => onOpenChange(false)}>
                        Cerrar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
