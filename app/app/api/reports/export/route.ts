import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { customReportService } from '@/lib/custom-report-service';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

async function generatePDF(reportData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 40 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fontSize(22).font('Helvetica-Bold').fillColor('#003d7a').text('ESCALAFIN - SISTEMA FINANCIERO', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(16).fillColor('#1e293b').text(reportData.title, { align: 'center' });
      doc.fontSize(10).fillColor('#64748b').text(`Período: ${reportData.period}`, { align: 'center' });
      doc.moveDown();
      doc.moveTo(40, doc.y).lineTo(570, doc.y).strokeColor('#cbd5e1').stroke();
      doc.moveDown();

      // Resumen
      doc.fontSize(13).fillColor('#0f172a').font('Helvetica-Bold').text('Resumen Ejecutivo');
      doc.moveDown(0.5);
      doc.fontSize(10).font('Helvetica').fillColor('#334155');

      if (reportData.summary) {
        Object.keys(reportData.summary).forEach((key) => {
          const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
          let value = reportData.summary[key];
          if (typeof value === 'number') {
            if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('total') || key.toLowerCase().includes('saldo')) {
              value = `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
            } else {
              value = value.toLocaleString('es-MX');
            }
          }
          doc.text(`• ${label}: `, { continued: true }).font('Helvetica-Bold').text(`${value}`).font('Helvetica');
        });
      }
      doc.moveDown();

      // Detalles
      if (reportData.details && reportData.details.length > 0) {
        doc.fontSize(13).fillColor('#0f172a').font('Helvetica-Bold').text('Detalle de Registros');
        doc.moveDown(0.5);
        doc.fontSize(8).font('Helvetica');

        reportData.details.slice(0, 100).forEach((item: any, index: number) => {
          if (index % 2 === 0) {
            doc.save();
            doc.fillColor('#f8fafc');
            doc.rect(40, doc.y - 2, 530, 14).fill();
            doc.restore();
          }

          let line = Object.values(item).map(v => String(v ?? '')).join(' | ');
          doc.fillColor('#1e293b').text(line, 40, doc.y, { width: 530, lineGap: 3 });
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tenantId = session.user.tenantId;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'loans';
    const timeRange = searchParams.get('timeRange') || '30days';
    const format = searchParams.get('format') || 'excel'; // 'excel' or 'pdf'
    const status = searchParams.get('status') || undefined;
    const advisorId = searchParams.get('advisorId') || undefined;

    // Rango de fechas
    const endDate = new Date();
    const startDate = new Date();
    switch (timeRange) {
      case '7days':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30days':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90days':
        startDate.setDate(endDate.getDate() - 90);
        break;
      case '1year':
        startDate.setFullYear(endDate.getFullYear() - 1);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    const config = {
      dataSource: (type === 'portfolio' ? 'loans' : type) as any,
      filters: {
        dateFrom: startDate,
        dateTo: endDate,
        status,
        asesorId: advisorId
      }
    };

    if (format === 'excel') {
      const buffer = await customReportService.generateExcelBuffer(tenantId, config, `Reporte_${type}`);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="Reporte_${type}_${endDate.toISOString().split('T')[0]}.xlsx"`,
        },
      });
    } else {
      // PDF
      const data = await customReportService.fetchData(tenantId, config);
      const reportData = {
        title: `Reporte de ${type.toUpperCase()}`,
        period: `${startDate.toLocaleDateString('es-MX')} al ${endDate.toLocaleDateString('es-MX')}`,
        summary: {
          totalRegistros: data.length,
          montoTotal: data.reduce((acc, row) => acc + (Number(row['Monto Principal ($)'] || row['Monto Pago ($)'] || row['Saldo Total Pendiente ($)'] || 0)), 0)
        },
        details: data
      };

      const pdfBuffer = await generatePDF(reportData);
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="Reporte_${type}_${endDate.toISOString().split('T')[0]}.pdf"`,
        },
      });
    }
  } catch (error: any) {
    console.error('Error generating report export:', error);
    return NextResponse.json({ error: error.message || 'Error al exportar reporte' }, { status: 500 });
  }
}
