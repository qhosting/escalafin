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
  clientAddress?: string | null;
}

export const generatePaymentReceiptPDF = async (data: ReceiptData): Promise<string> => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 160] // Un poco más alto para asegurar que quepa todo
  });

  // Estilos básicos
  const margin = 5;
  const pageWidth = 80;
  const contentWidth = pageWidth - (margin * 2);
  let y = 10;

  // Cabecera - Nombre del Tenant
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  const tenantLines = doc.splitTextToSize(data.tenantName.toUpperCase(), contentWidth);
  tenantLines.forEach((line: string) => {
    doc.text(line, pageWidth / 2, y, { align: 'center' });
    y += 6;
  });
  
  y += 2;
  doc.setFontSize(10);
  doc.text('RECIBO DE PAGO', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setLineWidth(0.1);
  doc.line(margin, y, pageWidth - margin, y);

  // Detalles principales
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
  const clientLines = doc.splitTextToSize(data.clientName, contentWidth);
  clientLines.forEach((line: string) => {
    doc.text(line, margin, y);
    y += 4;
  });

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.text('PRÉSTAMO:', margin, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  doc.text(data.loanNumber, margin, y);

  if (data.clientAddress) {
    y += 5;
    doc.setFont('helvetica', 'bold');
    doc.text('DIRECCIÓN:', margin, y);
    y += 4;
    doc.setFont('helvetica', 'normal');
    const addressLines = doc.splitTextToSize(data.clientAddress, contentWidth);
    addressLines.forEach((line: string) => {
      doc.text(line, margin, y);
      y += 4;
    });
  }

  y += 5;
  doc.line(margin, y, pageWidth - margin, y);

  // Montos
  y += 7;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL:', margin, y);
  doc.text(new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.amount), pageWidth - margin, y, { align: 'right' });

  y += 7;
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(`Método: ${data.paymentMethod}`, margin, y);
  
  y += 5;
  doc.setFont('helvetica', 'bold');
  doc.text('Concepto:', margin, y);
  y += 4;
  doc.setFont('helvetica', 'normal');
  // Word wrap para el concepto para evitar que se corte
  const conceptLines = doc.splitTextToSize(data.concept || 'Abono a capital / Mensualidad', contentWidth);
  conceptLines.forEach((line: string) => {
    doc.text(line, margin, y);
    y += 4;
  });

  y += 2;
  doc.setFont('helvetica', 'bold');
  doc.text(`Saldo Pendiente: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(data.balanceAfter)}`, margin, y);

  // Pie de página
  y += 12;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.text('Gracias por su pago.', pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text('Este documento es un comprobante oficial.', pageWidth / 2, y, { align: 'center' });

  // Retornar como Blob URL para evitar problemas de CSP en el viewer
  const blob = doc.output('blob');
  return URL.createObjectURL(blob);
};
