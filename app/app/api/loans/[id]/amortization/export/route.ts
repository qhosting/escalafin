
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import PDFDocument from 'pdfkit';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.tenantId) {
            return new NextResponse('No autorizado', { status: 401 });
        }

        const loanId = params.id;
        const tenantId = session.user.tenantId;
        const tenantPrisma = getTenantPrisma(tenantId);

        // 1. Obtener datos del préstamo y su tabla de amortización
        const loan = await (tenantPrisma.loan as any).findFirst({
            where: { id: loanId },
            include: {
                client: true,
                amortizationSchedule: {
                    orderBy: { paymentNumber: 'asc' },
                    include: {
                        payment: true
                    }
                }
            }
        });

        if (!loan) {
            return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
        }

        // 2. Generar el binario del PDF
        const pdfBuffer = await new Promise<any>((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 40, size: 'A4' });
                const chunks: any[] = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', err => reject(err));

                // --- Cabecera ---
                doc.rect(0, 0, doc.page.width, 100).fill('#1e293b');
                doc.fillColor('#ffffff').fontSize(24).font('Helvetica-Bold').text(session.user.tenantName || 'EscalaFin', 40, 30);
                doc.fontSize(10).font('Helvetica').text('Tabla de Amortización', 40, 65);
                
                doc.fontSize(12).font('Helvetica-Bold').text('DETALLE DE PRÉSTAMO', 350, 35, { align: 'right', width: 200 });
                doc.fontSize(9).font('Helvetica').text(`Fecha: ${new Date().toLocaleDateString('es-MX')}`, 350, 55, { align: 'right', width: 200 });
                doc.text(`Folio: ${loan.loanNumber}`, 350, 68, { align: 'right', width: 200 });

                // --- Datos Generales ---
                const infoTop = 120;
                doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('DATOS DEL CLIENTE', 40, infoTop);
                doc.rect(40, infoTop + 15, 250, 60).fill('#f8fafc');
                doc.fillColor('#0f172a').font('Helvetica').fontSize(9);
                doc.text(`Nombre: ${loan.client.firstName} ${loan.client.lastName}`, 50, infoTop + 25);
                doc.text(`Teléfono: ${loan.client.phone || 'N/A'}`, 50, infoTop + 40);
                doc.text(`Email: ${loan.client.email || 'N/A'}`, 50, infoTop + 55);

                doc.fillColor('#1e293b').fontSize(10).font('Helvetica-Bold').text('RESUMEN FINANCIERO', 305, infoTop);
                doc.rect(305, infoTop + 15, 250, 60).fill('#f8fafc');
                doc.fillColor('#0f172a').font('Helvetica').fontSize(9);
                doc.text(`Monto Principal: $${Number(loan.principalAmount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 315, infoTop + 25);
                doc.text(`Tasa Interés: ${(Number(loan.interestRate) * 100).toFixed(2)}%`, 315, infoTop + 40);
                doc.fillColor('#2563eb').font('Helvetica-Bold').text(`Pago Semanal: $${Number(loan.monthlyPayment).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 315, infoTop + 55);

                // --- Tabla de Amortización ---
                doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('PROGRAMA DE PAGOS', 40, 210);
                
                const tableTop = 230;
                const colX = [40, 70, 150, 230, 310, 390, 470];

                // Header de la tabla
                doc.rect(40, tableTop, 515, 20).fill('#1e293b');
                doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
                doc.text('#', colX[0], tableTop + 6);
                doc.text('FECHA', colX[1], tableTop + 6);
                doc.text('CAPITAL', colX[2], tableTop + 6);
                doc.text('INTERÉS', colX[3], tableTop + 6);
                doc.text('CUOTA', colX[4], tableTop + 6);
                doc.text('SALDO', colX[5], tableTop + 6);
                doc.text('ESTADO', colX[6], tableTop + 6);

                let y = tableTop + 20;
                doc.font('Helvetica').fontSize(8).fillColor('#334155');

                loan.amortizationSchedule.forEach((item: any, index: number) => {
                    // Cebra stripping
                    if (index % 2 === 0) {
                        doc.rect(40, y, 515, 20).fill('#f8fafc');
                    }
                    
                    doc.fillColor('#334155');
                    doc.text(item.paymentNumber.toString(), colX[0], y + 6);
                    doc.text(new Date(item.paymentDate).toLocaleDateString('es-MX'), colX[1], y + 6);
                    doc.text(`$${Number(item.principalPayment).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, colX[2], y + 6);
                    doc.text(`$${Number(item.interestPayment).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, colX[3], y + 6);
                    doc.text(`$${Number(item.totalPayment).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, colX[4], y + 6);
                    doc.text(`$${Number(item.remainingBalance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, colX[5], y + 6);
                    
                    if (item.isPaid) {
                        doc.fillColor('#16a34a').font('Helvetica-Bold').text('PAGADO', colX[6], y + 6).font('Helvetica');
                    } else {
                        doc.fillColor('#d97706').text('PENDIENTE', colX[6], y + 6);
                    }

                    y += 20;

                    // Nueva página si es necesario
                    if (y > 750) {
                        doc.addPage();
                        y = 40;
                    }
                });

                // Footer
                const finalY = Math.min(y + 20, 780);
                doc.fontSize(8).fillColor('#94a3b8').text('EscalaFin - Sistema de Gestión de Microcréditos', 40, finalY, { align: 'center', width: 515 });

                doc.end();
            } catch (err) { reject(err); }
        });

        return new NextResponse(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="Amortizacion_${loan.loanNumber}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (e: any) {
        console.error('❌ Error Amortization Export API:', e);
        return NextResponse.json({ error: 'Error del servidor', details: e.message }, { status: 500 });
    }
}
