'use client';

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export interface ReceiptData {
  tenantName: string;
  paymentId: string;
  amount: number;
  date: string;
  clientName: string;
  loanNumber: string;
  concept: string;
  paymentMethod: string;
  balanceAfter: number;
}

export const generatePaymentReceiptPDF = async (data: ReceiptData): Promise<string> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 150] // Formato ticket térmico
  });

  // Estilos básicos
  const margin = 5;
  let y = 10;

  // Cabecera
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(data.tenantName, 40, y, { align: 'center' });
  
  y += 7;
  doc.setFontSize(10);
  doc.text('RECIBO DE PAGO', 40, y, { align: 'center' });

  y += 5;
  doc.setLineWidth(0.1);
  doc.line(margin, y, 75, y);

  // Detalles del pago
  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Folio: ${data.paymentId.substring(0, 8).toUpperCase()}`, margin, y);
  
  y += 4;
  doc.text(`Fecha: ${data.date}`, margin, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE:', margin, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(data.clientName, margin, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text('PRÉSTAMO:', margin, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(data.loanNumber, margin, y);

  y += 5;
  doc.line(margin, y, 75, y);

  y += 7;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', margin, y);
  doc.text(new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.amount), 75, y, { align: 'right' });

  y += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Método: ${data.paymentMethod}`, margin, y);
  
  y += 4;
  doc.text(`Concepto: ${data.concept}`, margin, y);

  y += 6;
  doc.setFont('helvetica', 'bold');
  doc.text(`Saldo Pendiente: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.balanceAfter)}`, margin, y);

  y += 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Gracias por su pago.', 40, y, { align: 'center' });
  y += 4;
  doc.text('Este documento es un comprobante oficial.', 40, y, { align: 'center' });

  return doc.output('datauristring');
};
