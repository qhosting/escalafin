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
        let tenantInfo = null;
        if (tenantId && typeof tenantId === 'string' && tenantId.length > 0 && tenantId !== 'null') {
            try {
                tenantInfo = await prisma.tenant.findUnique({
                    where: { id: tenantId },
                    select: { name: true, logo: true }
                });
            } catch (err) {
                console.error('Error fetching tenant info for branding:', err);
            }
        }

        // Crear PDF
        const doc = new PDFDocument({ margin: 50, size: 'A4' });
        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        // Header decorativo
        doc.rect(0, 0, doc.page.width, 100).fill('#f8fafc');

        // Logo y Nombre del Tenant
        let textX = 50;
        if (tenantInfo?.logo) {
            try {
                // Notar: En un entorno real necesitaríamos descargar la imagen si es URL
                // pero si es path local o base64 funciona directo. 
                // Para este caso, seremos precavidos.
                const logoRes = await fetch(tenantInfo.logo).catch(() => null);
                if (logoRes && logoRes.ok) {
                    const logoBuffer = Buffer.from(await logoRes.arrayBuffer());
                    doc.image(logoBuffer, 50, 25, { height: 50 });
                    textX = 115;
                }
            } catch (e) {
                console.warn('Could not load tenant logo in PDF:', e);
            }
        }

        // Texto de cabecera (Izquierda)
        doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text(tenantInfo?.name || 'EscalaFin', textX, 35);
        doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Tu Aliado Financiero', textX, 64);

        // Título y Metadatos (Derecha) - Ajustado para evitar sobreposición
        doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('ESTADO DE CUENTA', 350, 35, { align: 'right', width: 200 });
        doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(`Folio Interno:`, 350, 58, { align: 'right', width: 130 });
        doc.fillColor('#475569').text(loan.loanNumber, 485, 58, { align: 'right', width: 60 });
        
        doc.fillColor('#94a3b8').text(`F. Impresión:`, 350, 70, { align: 'right', width: 130 });
        doc.fillColor('#475569').text(new Date().toLocaleDateString('es-MX'), 485, 70, { align: 'right', width: 60 });

        doc.moveDown(4);

        // Grid de Información (Cliente y Préstamo)
        const startY = 130;
        doc.lineCap('butt').moveTo(50, startY).lineTo(545, startY).strokeColor('#e2e8f0').lineWidth(1).stroke();

        // Columna 1: Cliente
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('DATOS DEL CLIENTE', 50, startY + 15);
        doc.fillColor('#0f172a').fontSize(11).text(`${loan.client.firstName} ${loan.client.lastName}`, 50, startY + 30);
        doc.fontSize(9).font('Helvetica').text(`Tel: ${loan.client.phone}`, 50, startY + 45);
        doc.text(`Email: ${loan.client.email}`, 50, startY + 58);

        // Columna 2: Resumen
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('RESUMEN DE CRÉDITO', 350, startY + 15);
        doc.fillColor('#0f172a').fontSize(10).font('Helvetica');
        doc.text(`Monto Original:`, 350, startY + 30);
        doc.text(`Saldo a la Fecha:`, 350, startY + 45);
        doc.text(`Estado del Crédito:`, 350, startY + 60);

        doc.fontSize(10).font('Helvetica-Bold');
        doc.text(`$${Number(loan.principalAmount).toLocaleString('es-MX')}`, 450, startY + 30, { align: 'right', width: 95 });
        doc.fillColor('#2563eb').text(`$${Number(loan.balanceRemaining).toLocaleString('es-MX')}`, 450, startY + 45, { align: 'right', width: 95 });
        
        const statusColors: any = { 'ACTIVE': '#16a34a', 'PAID_OFF': '#2563eb', 'OVERDUE': '#dc2626' };
        doc.fillColor(statusColors[loan.status] || '#475569').text(
            loan.status === 'ACTIVE' ? 'VIGENTE' : 
            loan.status === 'PAID_OFF' ? 'LIQUIDADO' : 
            loan.status === 'OVERDUE' ? 'MOROSO' : loan.status, 
            450, startY + 60, { align: 'right', width: 95 }
        );
        doc.font('Helvetica');

        // Línea separadora
        doc.moveTo(50, startY + 85).lineTo(545, startY + 85).strokeColor('#e2e8f0').stroke();

        doc.moveDown(2);

        // Tabla de Historial de Pagos
        doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text('HISTORIAL DE MOVIMIENTOS', 50);
        doc.moveDown(0.5);

        const tableTop = doc.y;
        doc.rect(50, tableTop, 495, 20).fill('#f1f5f9');
        doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold');
        doc.text('FECHA', 60, tableTop + 7);
        doc.text('CONCEPTO', 150, tableTop + 7);
        doc.text('FOLIO/REF', 300, tableTop + 7);
        doc.text('ABONO', 460, tableTop + 7, { width: 80, align: 'right' });

        let currentY = tableTop + 25;
        doc.font('Helvetica').fillColor('#334155').fontSize(9);

        if (loan.payments.length === 0) {
            doc.text('No se registran movimientos a la fecha.', 60, currentY);
            currentY += 20;
        } else {
            loan.payments.forEach((p: any) => {
                if (currentY > 720) {
                    doc.addPage();
                    currentY = 50;
                }
                const pDate = new Date(p.paymentDate).toLocaleDateString('es-MX');
                doc.text(pDate, 60, currentY);
                doc.text(p.paymentMethod === 'CASH' ? 'Abono en Efectivo' : 'Abono Transferencia', 150, currentY);
                doc.text(p.reference || '-', 300, currentY);
                doc.font('Helvetica-Bold').text(`$${Number(p.amount).toLocaleString('es-MX')}`, 460, currentY, { width: 80, align: 'right' }).font('Helvetica');

                doc.moveTo(50, currentY + 12).lineTo(545, currentY + 12).strokeColor('#f8fafc').lineWidth(0.5).stroke();
                currentY += 20;
            });
        }

        // Fila de Saldo Final (Resaltada)
        if (currentY > 720) {
            doc.addPage();
            currentY = 50;
        }
        doc.rect(50, currentY, 495, 25).fill('#f8fafc');
        doc.fillColor('#1e293b').font('Helvetica-Bold').fontSize(10);
        doc.text('SALDO ACTUAL AL CORTE', 60, currentY + 8);
        doc.fillColor('#2563eb').text(`$${Number(loan.balanceRemaining).toLocaleString('es-MX')}`, 460, currentY + 8, { width: 80, align: 'right' });
        doc.font('Helvetica');

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
