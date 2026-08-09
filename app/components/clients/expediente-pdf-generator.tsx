'use client';

/**
 * ExpedientePdfGenerator — EscalaFin v3.1.0
 * Genera expediente PDF del cliente en dos modalidades:
 * 1. Resumen Ejecutivo (Ligero: datos de cliente, aval, garantías, tabla KYC)
 * 2. Expediente Completo (Incluye imágenes de documentos escaneados)
 */

import { useState } from 'react';
import { FileText, Download, Loader2, CheckCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { DocumentSlot } from './digital-vault';

interface ExpedientePdfGeneratorProps {
  clientData: any;
  documents: DocumentSlot[];
  photoUrl?: string | null;
}

export function ExpedientePdfGenerator({
  clientData,
  documents,
  photoUrl,
}: ExpedientePdfGeneratorProps) {
  const [generating, setGenerating] = useState(false);

  const generatePDF = async (type: 'executive' | 'full') => {
    setGenerating(true);
    try {
      // Import dinámico jsPDF y autoTable
      const { default: jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      // Header Banner
      doc.setFillColor(37, 99, 235); // #2563eb Primary
      doc.rect(0, 0, pageWidth, 28, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('ESCALAFIN - EXPEDIENTE DIGITAL DE CLIENTE', 14, 18);

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Fecha: ${new Date().toLocaleDateString('es-MX')} ${new Date().toLocaleTimeString('es-MX')}`, pageWidth - 14, 18, { align: 'right' });

      let yPos = 38;

      // Foto de Perfil (si existe)
      if (photoUrl && photoUrl.startsWith('data:image')) {
        try {
          doc.addImage(photoUrl, 'JPEG', pageWidth - 45, yPos, 30, 30);
        } catch {
          // Si falla formato de imagen, omitir
        }
      }

      // Datos Personales
      doc.setTextColor(30, 41, 59);
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('1. Información Personal', 14, yPos);
      yPos += 6;

      const personalData = [
        ['Nombre Completo', `${clientData.firstName || ''} ${clientData.lastName || ''}`.trim() || 'N/A'],
        ['Teléfono', clientData.phone || 'N/A'],
        ['Email', clientData.email || 'N/A'],
        ['Fecha Nacimiento', clientData.dateOfBirth || 'N/A'],
        ['Dirección', clientData.address ? `${clientData.address}, ${clientData.city || ''} ${clientData.state || ''} C.P. ${clientData.postalCode || ''}` : 'N/A'],
        ['Ubicación GPS', clientData.latitude ? `${clientData.latitude.toFixed(6)}, ${clientData.longitude?.toFixed(6)}` : 'No capturada'],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Campo', 'Valor']],
        body: personalData,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: photoUrl ? 50 : 14 },
        styles: { fontSize: 9, cellPadding: 2 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Información Financiera y Laboral
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('2. Información Financiera y Laboral', 14, yPos);
      yPos += 6;

      const financialData = [
        ['Ingreso Mensual', clientData.monthlyIncome ? `$${Number(clientData.monthlyIncome).toLocaleString('es-MX')}` : 'N/A'],
        ['Score Crediticio', clientData.creditScore || 'N/A'],
        ['Tipo de Empleo', clientData.employmentType || 'N/A'],
        ['Empleador', clientData.employerName || 'N/A'],
        ['Banco Principal', clientData.bankName || 'N/A'],
        ['Número de Cuenta', clientData.accountNumber || 'N/A'],
      ];

      autoTable(doc, {
        startY: yPos,
        head: [['Concepto', 'Detalle']],
        body: financialData,
        theme: 'striped',
        headStyles: { fillColor: [71, 85, 105], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9, cellPadding: 2 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 10;

      // Información del Aval
      if (clientData.guarantorFullName) {
        doc.setFontSize(13);
        doc.setFont('helvetica', 'bold');
        doc.text('3. Información del Aval', 14, yPos);
        yPos += 6;

        const avalData = [
          ['Nombre del Aval', clientData.guarantorFullName],
          ['Parentesco', clientData.guarantorRelationship || 'N/A'],
          ['Teléfono', clientData.guarantorPhone || 'N/A'],
          ['Dirección Aval', clientData.guarantorAddress || 'N/A'],
        ];

        autoTable(doc, {
          startY: yPos,
          head: [['Campo', 'Valor']],
          body: avalData,
          theme: 'striped',
          headStyles: { fillColor: [147, 51, 234], textColor: 255, fontStyle: 'bold' },
          margin: { left: 14, right: 14 },
          styles: { fontSize: 9, cellPadding: 2 },
        });

        yPos = (doc as any).lastAutoTable.finalY + 10;
      }

      // Estatus Bóveda Digital (Tabla de KYC)
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('4. Bóveda Digital — Documentos KYC', 14, yPos);
      yPos += 6;

      const docRows = documents.map((d) => [
        d.label,
        d.required ? 'Sí' : 'No',
        d.status,
        d.driveUrl ? 'En Google Drive' : d.file ? 'Almacenado Local' : 'Pendiente',
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Documento', 'Requerido', 'Estado', 'Almacenamiento']],
        body: docRows,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129], textColor: 255, fontStyle: 'bold' },
        margin: { left: 14, right: 14 },
        styles: { fontSize: 9, cellPadding: 2.5 },
      });

      yPos = (doc as any).lastAutoTable.finalY + 15;

      // Si es versión completa, agregar imágenes de documentos en páginas adicionales
      if (type === 'full') {
        const uploadedDocs = documents.filter((d) => d.previewUrl && d.file?.type.startsWith('image/'));
        if (uploadedDocs.length > 0) {
          doc.addPage();
          doc.setFontSize(14);
          doc.setFont('helvetica', 'bold');
          doc.text('Anexo: Documentos Digitalizados', 14, 20);

          let imgY = 30;
          for (const d of uploadedDocs) {
            if (imgY + 80 > pageHeight - 20) {
              doc.addPage();
              imgY = 20;
            }
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text(`${d.label} [${d.status}]`, 14, imgY);
            imgY += 6;

            try {
              doc.addImage(d.previewUrl!, 'JPEG', 14, imgY, 80, 60);
              imgY += 68;
            } catch {
              doc.setFontSize(9);
              doc.setFont('helvetica', 'italic');
              doc.text('(No se pudo renderizar la vista previa de este archivo)', 14, imgY);
              imgY += 12;
            }
          }
        }
      }

      // Footer en última página
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(
          `EscalaFin v3.1.0 — Documento de expedientes digitales — Página ${i} de ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }

      // Descargar
      const fileName = `Expediente_${clientData.firstName || 'Cliente'}_${clientData.lastName || ''}_${type === 'full' ? 'Completo' : 'Resumen'}.pdf`;
      doc.save(fileName.replace(/\s+/g, '_'));
      toast.success(`Expediente PDF (${type === 'full' ? 'Completo' : 'Resumen'}) generado`);
    } catch (err: any) {
      console.error('Error al generar PDF:', err);
      toast.error('Error al generar el expediente PDF');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700">
      <div className="flex items-center gap-2 flex-1 min-w-[200px]">
        <FileText className="w-5 h-5 text-blue-600" />
        <div>
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 block">
            Generar Expediente Digital PDF
          </span>
          <span className="text-xs text-slate-500">
            Descarga la ficha técnica del cliente con sellos y documentos KYC.
          </span>
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => generatePDF('executive')}
          disabled={generating}
          className="gap-1.5 text-xs"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
          Resumen Ejecutivo
        </Button>

        <Button
          type="button"
          size="sm"
          onClick={() => generatePDF('full')}
          disabled={generating}
          className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white"
        >
          {generating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
          Expediente Completo
        </Button>
      </div>
    </div>
  );
}
