import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { prisma } from '@/lib/prisma'; // Para buscar el tenant info (branding)
import PDFDocument from 'pdfkit';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse('No autorizado o sesión expirada', { status: 401 });
        }

        const loanId = params.id;
        const tenantId = session.user.tenantId;
        const tenantPrisma = getTenantPrisma(tenantId);

        // Obtener datos del préstamo con prisma de tenant (seguridad)
        const loan = await (tenantPrisma.loan as any).findFirst({
            where: { id: loanId },
            include: {
                client: true,
                payments: {
                    where: { status: 'COMPLETED' },
                    orderBy: { paymentDate: 'desc' }
                },
                amortizationSchedule: {
                    orderBy: { paymentNumber: 'asc' },
                }
            }
        });

        if (!loan) {
            return new NextResponse('Préstamo no encontrado en su cuenta', { status: 404 });
        }

        // Si el rol es CLIENTE, solo puede ver SU propio préstamo
        if (session.user.role === 'CLIENTE') {
            // Verificar que el cliente esté vinculado a este préstamo vía userId
            const clientRecord = await tenantPrisma.client.findFirst({
                where: { userId: session.user.id }
            });
            if (!clientRecord || loan.clientId !== clientRecord.id) {
                return new NextResponse('No autorizado para ver este préstamo', { status: 403 });
            }
        }

        // Obtener branding del tenant (nombre, logo si existe)
        const tenantInfo = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: { name: true, logo: true }
        });

        // Crear PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        // Header decorativo
        doc.rect(0, 0, doc.page.width, 100).fill('#f8fafc');

        // Texto de cabecera
        doc.fillColor('#1e293b').fontSize(24).text(tenantInfo?.name || 'EscalaFin', 50, 40);
        doc.fontSize(10).fillColor('#64748b').text('Tu Aliado Financiero', 50, 68);

        doc.fillColor('#0f172a').fontSize(16).text('ESTADO DE CUENTA', 400, 45, { align: 'right' });
        doc.fontSize(9).fillColor('#64748b').text(`Folio: ${loan.loanNumber}`, 400, 65, { align: 'right' });
        doc.text(`Fecha de Impresión: ${new Date().toLocaleDateString('es-MX')}`, 400, 78, { align: 'right' });

        doc.moveDown(4);

        // Grid de Información (Cliente y Préstamo)
        const startY = 130;
        doc.lineCap('butt').moveTo(50, startY).lineTo(545, startY).strokeColor('#e2e8f0').stroke();

        // Columna 1: Cliente
        doc.fillColor('#64748b').fontSize(9).text('DATOS DEL CLIENTE', 50, startY + 15);
        doc.fillColor('#0f172a').fontSize(11).text(`${loan.client.firstName} ${loan.client.lastName}`, 50, startY + 30);
        doc.fontSize(9).text(`Tel: ${loan.client.phone}`, 50, startY + 45);
        doc.text(`Email: ${loan.client.email}`, 50, startY + 58);

        // Columna 2: Resumen
        doc.fillColor('#64748b').text('RESUMEN DE CRÉDITO', 350, startY + 15);
        doc.fillColor('#0f172a').fontSize(10);
        doc.text(`Monto Prestado:`, 350, startY + 30);
        doc.text(`Saldo a la Fecha:`, 350, startY + 45);
        doc.text(`Estatus:`, 350, startY + 60);

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`$${Number(loan.principalAmount).toLocaleString('es-MX')}`, 450, startY + 30, { align: 'right' });
        doc.text(`$${Number(loan.balanceRemaining).toLocaleString('es-MX')}`, 450, startY + 45, { align: 'right' });
        doc.text(loan.status === 'ACTIVE' ? 'ACTIVO' : loan.status, 450, startY + 60, { align: 'right' });
        doc.font('Helvetica');

        // Línea separadora
        doc.moveTo(50, startY + 85).lineTo(545, startY + 85).strokeColor('#e2e8f0').stroke();

        doc.moveDown(2);

        // Tabla de Historial de Pagos
        doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('HISTORIAL DE MOVIMIENTOS', 50);
        doc.moveDown(0.5);

        const tableTop = doc.y;
        doc.rect(50, tableTop, 495, 20).fill('#f1f5f9');
        doc.fillColor('#475569').fontSize(9).font('Helvetica-Bold');
        doc.text('FECHA', 60, tableTop + 6);
        doc.text('CONCEPTO', 150, tableTop + 6);
        doc.text('FOLIO/REF', 300, tableTop + 6);
        doc.text('ABONO', 460, tableTop + 6, { width: 80, align: 'right' });

        let currentY = tableTop + 25;
        doc.font('Helvetica').fillColor('#334155');

        if (loan.payments.length === 0) {
            doc.text('No se registran pagos a la fecha.', 60, currentY);
        } else {
            loan.payments.forEach((p: any) => {
                if (currentY > 750) {
                    doc.addPage();
                    currentY = 50;
                }
                const pDate = new Date(p.paymentDate).toLocaleDateString('es-MX');
                doc.text(pDate, 60, currentY);
                doc.text(p.paymentMethod === 'CASH' ? 'Pago en Efectivo' : 'Referencia Bancaria', 150, currentY);
                doc.text(p.reference || '-', 300, currentY);
                doc.font('Helvetica-Bold').text(`$${Number(p.amount).toLocaleString('es-MX')}`, 460, currentY, { width: 80, align: 'right' }).font('Helvetica');

                doc.moveTo(50, currentY + 12).lineTo(545, currentY + 12).strokeColor('#f1f5f9').lineWidth(0.5).stroke();
                currentY += 20;
            });
        }

        // Pie de página
        doc.fontSize(8).fillColor('#94a3b8').text(
            'Este documento es un comprobante informativo del estado de su crédito. EscalaFin agradece su puntualidad.',
            50, 780, { align: 'center' }
        );

        return new Promise<NextResponse>((resolve) => {
            doc.on('end', () => {
                try {
                    const pdfData = Buffer.concat(chunks);
                    const response = new NextResponse(pdfData, {
                        status: 200,
                        headers: {
                            'Content-Type': 'application/pdf',
                            'Content-Disposition': `inline; filename="Estado_Cuenta_${loan.loanNumber}.pdf"`,
                            'Content-Length': pdfData.length.toString(),
                        },
                    });
                    resolve(response);
                } catch (err) {
                    console.error('Error concatenating PDF chunks:', err);
                    resolve(NextResponse.json({ error: 'Error procesando el archivo PDF' }, { status: 500 }));
                }
            });

            doc.on('error', (err) => {
                console.error('PDFKit Error:', err);
                resolve(NextResponse.json({ error: 'Falla al generar PDF: ' + err.message }, { status: 500 }));
            });
            
            // Finalize PDF AFTER listeners are attached
            try {
                doc.end();
            } catch (err) {
                console.error('Error in doc.end():', err);
                resolve(NextResponse.json({ error: 'Error al finalizar el PDF' }, { status: 500 }));
            }
        });

    } catch (error) {
        console.error('Error in statement API:', error);
        return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
    }
}
