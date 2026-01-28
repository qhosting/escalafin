
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/db';
import PDFDocument from 'pdfkit';
import ExcelJS from 'exceljs';

export const dynamic = 'force-dynamic';

async function generatePDF(reportData: any): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', (err) => reject(err));

      // Header
      doc.fontSize(20).text('EscalaFin', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(16).text(reportData.title, { align: 'center' });
      doc.fontSize(12).text(`Período: ${reportData.period}`, { align: 'center' });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Summary Section
      doc.fontSize(14).font('Helvetica-Bold').text('Resumen Ejecutivo');
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica');

      const summaryKeys = Object.keys(reportData.summary);
      summaryKeys.forEach((key) => {
        // Format key from camelCase to Title Case
        const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
        let value = reportData.summary[key];

        // Format numbers if they look like currency
        if (typeof value === 'number') {
          if (key.toLowerCase().includes('amount') || key.toLowerCase().includes('average')) {
             value = `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
          } else {
             value = value.toLocaleString('es-MX');
          }
        }

        doc.text(`${label}: ${value}`, { indent: 20 });
      });
      doc.moveDown();

      // Details Section
      if (reportData.details && reportData.details.length > 0) {
        doc.addPage();
        doc.fontSize(14).font('Helvetica-Bold').text('Detalles');
        doc.moveDown(0.5);
        doc.fontSize(9).font('Helvetica');

        // Simple listing for details
        reportData.details.forEach((item: any, index: number) => {
          // Background for alternate rows
          if (index % 2 === 0) {
            doc.save();
            doc.fillColor('#f0f0f0');
            doc.rect(50, doc.y - 2, 500, 14).fill();
            doc.restore();
          }

          let line = '';
          // Customize output based on report type keys
          if (item.client) line += `${item.client} | `;
          if (item.date) line += `${item.date} | `;
          if (item.amount) line += `$${Number(item.amount).toFixed(2)} | `;
          if (item.status) line += `${item.status} | `;
          if (item.method) line += `${item.method}`;

          // Remove trailing separator if exists
          if (line.endsWith(' | ')) line = line.slice(0, -3);

          doc.text(line, 50, doc.y, { width: 500, lineGap: 4 });
        });
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

async function generateExcel(reportData: any): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Reporte');

  // Title and Period
  worksheet.getCell('A1').value = 'EscalaFin - ' + reportData.title;
  worksheet.getCell('A1').font = { size: 16, bold: true };
  worksheet.mergeCells('A1:D1');

  worksheet.getCell('A2').value = 'Período: ' + reportData.period;
  worksheet.getCell('A2').font = { size: 12 };
  worksheet.mergeCells('A2:D2');

  worksheet.addRow([]);

  // Summary
  worksheet.getCell('A4').value = 'Resumen Ejecutivo';
  worksheet.getCell('A4').font = { size: 14, bold: true };

  let currentRow = 5;
  const summaryKeys = Object.keys(reportData.summary);
  summaryKeys.forEach((key) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());
    const value = reportData.summary[key];

    worksheet.getCell(`A${currentRow}`).value = label;
    worksheet.getCell(`B${currentRow}`).value = value;
    currentRow++;
  });

  worksheet.addRow([]);
  currentRow++;

  // Details Header
  worksheet.getCell(`A${currentRow}`).value = 'Detalles';
  worksheet.getCell(`A${currentRow}`).font = { size: 14, bold: true };
  currentRow++;

  if (reportData.details && reportData.details.length > 0) {
    // Generate headers from first detail item keys
    const headers = Object.keys(reportData.details[0]).map(key =>
      key.charAt(0).toUpperCase() + key.slice(1)
    );

    worksheet.getRow(currentRow).values = headers;
    worksheet.getRow(currentRow).font = { bold: true };
    currentRow++;

    // Add data rows
    reportData.details.forEach((item: any) => {
      worksheet.addRow(Object.values(item));
    });
  }

  // Adjust column widths
  worksheet.columns.forEach(column => {
    column.width = 20;
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return buffer as Buffer;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['ADMIN', 'ASESOR'].includes(session.user.role)) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'general';
    const timeRange = searchParams.get('timeRange') || '30days';
    const format = searchParams.get('format') || 'pdf'; // 'pdf' or 'excel'

    // Calculate date range
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

    let reportData: any = {};

    // Generate different report types
    switch (type) {
      case 'payments':
        const payments = await prisma.payment.findMany({
          where: {
            paymentDate: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            loan: {
              include: {
                client: true
              }
            }
          },
          orderBy: {
            paymentDate: 'desc'
          }
        });

        reportData = {
          title: 'Reporte de Pagos',
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          summary: {
            totalPayments: payments.length,
            totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
            averagePayment: payments.length > 0 ? 
              payments.reduce((sum, p) => sum + Number(p.amount), 0) / payments.length : 0
          },
          details: payments.map(p => ({
            date: p.paymentDate.toLocaleDateString(),
            client: `${p.loan.client.firstName} ${p.loan.client.lastName}`,
            amount: Number(p.amount),
            method: p.paymentMethod,
            status: p.status
          }))
        };
        break;

      case 'portfolio':
        const loans = await prisma.loan.findMany({
          where: {
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          },
          include: {
            client: true,
            payments: true
          }
        });

        reportData = {
          title: 'Reporte de Cartera',
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          summary: {
            totalLoans: loans.length,
            totalAmount: loans.reduce((sum, l) => sum + Number(l.principalAmount || 0), 0),
            activeLoans: loans.filter(l => l.status === 'ACTIVE').length,
            overdueLoans: loans.filter(l => l.status === 'DEFAULTED').length
          },
          details: loans.map(l => ({
            client: `${l.client.firstName} ${l.client.lastName}`,
            amount: Number(l.principalAmount || 0),
            status: l.status,
            date: l.startDate.toLocaleDateString()
          }))
        };
        break;

      case 'performance':
        const monthlyData = await prisma.payment.groupBy({
          by: ['paymentDate'],
          where: {
            paymentDate: {
              gte: startDate,
              lte: endDate
            }
          },
          _sum: {
            amount: true
          },
          _count: {
            id: true
          }
        });

        reportData = {
          title: 'Reporte de Rendimiento',
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          summary: {
            totalCollections: monthlyData.reduce((sum, d) => sum + Number(d._sum.amount || 0), 0),
            averageMonthly: monthlyData.length > 0 ? 
              monthlyData.reduce((sum, d) => sum + Number(d._sum.amount || 0), 0) / monthlyData.length : 0,
            transactionsCount: monthlyData.reduce((sum, d) => sum + d._count.id, 0)
          },
          details: monthlyData.map(d => ({
            date: d.paymentDate.toLocaleDateString(),
            amount: Number(d._sum.amount || 0),
            method: `Tx: ${d._count.id}`
          }))
        };
        break;

      default:
        reportData = {
          title: 'Reporte General',
          period: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
          summary: {
            message: 'Reporte básico generado'
          },
          details: []
        };
    }

    if (format === 'excel') {
      const excelBuffer = await generateExcel(reportData);
      return new NextResponse(excelBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${type}-report-${endDate.toISOString().split('T')[0]}.xlsx"`,
        },
      });
    } else {
      // Default to PDF
      const pdfBuffer = await generatePDF(reportData);
      return new NextResponse(pdfBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${type}-report-${endDate.toISOString().split('T')[0]}.pdf"`,
        },
      });
    }

  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Error generando reporte' },
      { status: 500 }
    );
  }
}
