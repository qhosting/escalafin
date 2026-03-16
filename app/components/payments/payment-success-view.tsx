'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  CheckCircle2, 
  Share2, 
  Download, 
  MessageSquare, 
  Loader2,
  X
} from 'lucide-react';
import { generatePaymentReceiptPDF, ReceiptData } from '@/lib/pdf-utils';
import { toast } from 'sonner';

interface PaymentSuccessViewProps {
  payment: any;
  onClose: () => void;
}

export function PaymentSuccessView({ payment, onClose }: PaymentSuccessViewProps) {
  const [sending, setSending] = useState(false);

  const handleDownload = async () => {
    try {
      const receiptData: ReceiptData = {
        tenantName: 'EscalaFin', // Podríamos obtenerlo del contexto
        paymentId: payment.id,
        amount: payment.amount,
        date: new Date(payment.paymentDate).toLocaleDateString('es-MX'),
        clientName: payment.clientName || 'Cliente',
        loanNumber: payment.loanNumber || '#N/A',
        concept: payment.notes || 'Abono a capital',
        paymentMethod: payment.paymentMethod || 'Efectivo',
        balanceAfter: payment.balanceAfter || 0,
      };

      const pdfBase64 = await generatePaymentReceiptPDF(receiptData);
      const link = document.createElement('a');
      link.href = pdfBase64;
      link.download = `Recibo_${payment.id.substring(0, 8)}.pdf`;
      link.click();
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Error al generar el PDF');
    }
  };

  const handleSendWhatsApp = async () => {
    setSending(true);
    try {
      const receiptData: ReceiptData = {
        tenantName: 'EscalaFin',
        paymentId: payment.id,
        amount: payment.amount,
        date: new Date(payment.paymentDate).toLocaleDateString('es-MX'),
        clientName: payment.clientName || 'Cliente',
        loanNumber: payment.loanNumber || '#N/A',
        concept: payment.notes || 'Abono a capital',
        paymentMethod: payment.paymentMethod || 'Efectivo',
        balanceAfter: payment.balanceAfter || 0,
      };

      const pdfBase64 = await generatePaymentReceiptPDF(receiptData);
      
      const response = await fetch('/api/payments/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: payment.id,
          fileBase64: pdfBase64
        }),
      });

      if (response.ok) {
        toast.success('Recibo enviado por WhatsApp');
      } else {
        throw new Error('Error al enviar');
      }
    } catch (error) {
      console.error('WhatsApp send error:', error);
      toast.error('No se pudo enviar el recibo');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-6 text-center animate-in zoom-in duration-300">
      <div className="bg-green-100 p-4 rounded-full">
        <CheckCircle2 className="h-16 w-16 text-green-600 animate-bounce" />
      </div>
      
      <div>
        <h2 className="text-2xl font-bold text-gray-900">¡Pago Registrado!</h2>
        <p className="text-gray-600 mt-2">
          Se ha aplicado el pago de **{new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(payment.amount)}** correctamente.
        </p>
      </div>

      <div className="w-full space-y-3 pt-4">
        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2 border-green-500 text-green-700 hover:bg-green-50"
          onClick={handleSendWhatsApp}
          disabled={sending}
        >
          {sending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MessageSquare className="h-4 w-4" />
          )}
          {sending ? 'Enviando...' : 'Enviar Recibo por WhatsApp'}
        </Button>

        <Button 
          variant="outline" 
          className="w-full flex items-center justify-center gap-2"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          Descargar Recibo PDF
        </Button>

        <Button 
          className="w-full mt-6"
          onClick={onClose}
        >
          Finalizar
        </Button>
      </div>
    </div>
  );
}
