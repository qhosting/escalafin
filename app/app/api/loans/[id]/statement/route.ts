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
            select: {
                id: true,
                loanNumber: true,
                principalAmount: true,
                balanceRemaining: true,
                status: true,
                clientId: true,
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
        doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text(tenantInfo?.name || session.user.tenantName || 'EscalaFin', textX, 35);
        doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Tu Aliado Financiero', textX, 63);

        // Título y Metadatos (Derecha)
        doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('ESTADO DE CUENTA', 350, 35, { align: 'right', width: 200 });
        doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(`Folio:`, 350, 58, { align: 'right', width: 140 });
        doc.fillColor('#1e293b').font('Helvetica-Bold').text(loan.loanNumber, 495, 58, { align: 'right', width: 50 });
        
        doc.font('Helvetica').fillColor('#94a3b8').text(`F. Impresión:`, 350, 70, { align: 'right', width: 140 });
        doc.fillColor('#1e293b').text(new Date().toLocaleDateString('es-MX'), 495, 70, { align: 'right', width: 50 });

        // Contenedor principal para datos (Grid)
        const sectionTop = 130;
        doc.rect(50, sectionTop, 495, 80).fill('#f8fafc');
        doc.rect(50, sectionTop, 495, 80).strokeColor('#e2e8f0').lineWidth(0.5).stroke();

        // DATOS DEL CLIENTE (Columna 1)
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('DATOS DEL CLIENTE', 65, sectionTop + 15);
        doc.fillColor('#0f172a').fontSize(11).text(`${loan.client.firstName} ${loan.client.lastName}`, 65, sectionTop + 28);
        doc.fontSize(9).font('Helvetica').fillColor('#475569');
        doc.text(`ID: ${loan.client.id.substring(0, 8).toUpperCase()}`, 65, sectionTop + 42);
        doc.text(`Tel: ${loan.client.phone}`, 65, sectionTop + 54);

        // RESUMEN DE CRÉDITO (Columna 2)
        doc.fillColor('#64748b').fontSize(8).font('Helvetica-Bold').text('RESUMEN DE CRÉDITO', 350, sectionTop + 15);
        doc.fillColor('#475569').fontSize(9).font('Helvetica');
        doc.text('Monto Original:', 350, sectionTop + 28);
        doc.text('Saldo Pendiente:', 350, sectionTop + 42);
        doc.text('Estado:', 350, sectionTop + 56);

        doc.fontSize(10).font('Helvetica-Bold');
        doc.fillColor('#0f172a').text(`$${Number(loan.principalAmount).toLocaleString('es-MX')}`, 450, sectionTop + 28, { align: 'right', width: 85 });
        doc.fillColor('#2563eb').text(`$${Number(loan.balanceRemaining).toLocaleString('es-MX')}`, 450, sectionTop + 42, { align: 'right', width: 85 });
        
        const statusColors: any = { 
            'ACTIVE': '#16a34a', 
            'PAID_OFF': '#2563eb', 
            'OVERDUE': '#dc2626',
            'DEFAULTED': '#991b1b'
        };
        const statusLabels: any = {
            'ACTIVE': 'VIGENTE',
            'PAID_OFF': 'LIQUIDADO',
            'OVERDUE': 'MOROSO',
            'DEFAULTED': 'INCUMPLIDO'
        };
        doc.fillColor(statusColors[loan.status] || '#475569').text(
            statusLabels[loan.status] || loan.status, 
            450, sectionTop + 56, { align: 'right', width: 85 }
        );

        // Espacio dinámico antes de movimientos
        doc.y = sectionTop + 105;

        // Título de Movimientos con línea decorativa
        doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('HISTORIAL DE MOVIMIENTOS', 50);
        const titleY = doc.y;
        doc.strokeColor('#2563eb').lineWidth(2).moveTo(50, titleY + 2).lineTo(150, titleY + 2).stroke();
        
        doc.moveDown(1.5);

        // Tabla de Movimientos con diseño Premium
        const tableTop = doc.y;
        doc.rect(50, tableTop, 495, 22).fill('#2563eb');
        doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
        doc.text('FECHA', 65, tableTop + 8);
        doc.text('CONCEPTO', 150, tableTop + 8);
        doc.text('REFERENCIA', 320, tableTop + 8);
        doc.text('ABONO', 460, tableTop + 8, { width: 75, align: 'right' });

        let currentY = tableTop + 22;
        doc.font('Helvetica').fillColor('#334155').fontSize(9);

        if (loan.payments.length === 0) {
            doc.rect(50, currentY, 495, 40).fill('#fef2f2');
            doc.fillColor('#991b1b').text('No se registran pagos acreditados para este crédito al día de hoy.', 65, currentY + 15);
            currentY += 40;
        } else {
            loan.payments.forEach((p: any, index: number) => {
                if (currentY > 700) {
                    doc.addPage();
                    currentY = 50;
                    // Redibujar cabecera en nueva página
                    doc.rect(50, currentY, 495, 22).fill('#2563eb');
                    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
                    doc.text('FECHA', 65, currentY + 8);
                    doc.text('CONCEPTO', 150, currentY + 8);
                    doc.text('REFERENCIA', 320, currentY + 8);
                    doc.text('ABONO', 460, currentY + 8, { width: 75, align: 'right' });
                    currentY += 22;
                }

                if (index % 2 === 0) {
                    doc.rect(50, currentY, 495, 25).fill('#fcfcfd');
                }

                const pDate = new Date(p.paymentDate).toLocaleDateString('es-MX');
                doc.fillColor('#475569').text(pDate, 65, currentY + 8);
                doc.fillColor('#1e293b').text(p.paymentMethod === 'CASH' ? 'Abono en Efectivo' : 'Abono Transferencia', 150, currentY + 8);
                doc.fillColor('#64748b').fontSize(8).text(p.reference || 'S/R', 320, currentY + 9).fontSize(9);
                doc.fillColor('#2563eb').font('Helvetica-Bold').text(`$${Number(p.amount).toLocaleString('es-MX')}`, 460, currentY + 8, { width: 75, align: 'right' }).font('Helvetica');

                doc.strokeColor('#f1f5f9').lineWidth(0.5).moveTo(50, currentY + 25).lineTo(545, currentY + 25).stroke();
                currentY += 25;
            });
        }

        // Fila de Saldo Final Resaltada
        if (currentY > 720) {
            doc.addPage();
            currentY = 50;
        }
        doc.rect(50, currentY, 495, 30).fill('#1e293b');
        doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10);
        doc.text('SALDO ACTUAL AL CORTE', 65, currentY + 10);
        doc.fontSize(12).text(`$${Number(loan.balanceRemaining).toLocaleString('es-MX')}`, 400, currentY + 9, { width: 135, align: 'right' });
        doc.font('Helvetica');

        // Pie de página detallado
        doc.rect(0, 822, doc.page.width, 20).fill('#2563eb');
        doc.fontSize(7).fillColor('#ffffff').text(
            'EscalaFin - Tu gestión financiera inteligente. Documento generado digitalmente.',
            50, 829, { align: 'center' }
        );

        doc.fontSize(8).fillColor('#94a3b8').text(
            'Nota: Este documento es informativo. Cualquier discrepancia debe reportarse en las próximas 48 horas.',
            50, 780, { align: 'center', width: 495 }
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
