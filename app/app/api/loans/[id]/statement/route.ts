
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getTenantPrisma } from '@/lib/tenant-db';
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';

export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user) {
            return new NextResponse('No autorizado', { status: 401 });
        }

        const loanId = params.id;
        const tenantId = session.user.tenantId;

        // 🛡️ Log de diagnóstico
        console.log(`[PDF] Generando estado para préstamo ${loanId} (Tenant: ${tenantId})`);

        const tenantPrisma = getTenantPrisma(tenantId);
        
        // 1. Obtener datos con SELECT explícito para evitar fallos de memoria
        const loan = await (tenantPrisma.loan as any).findFirst({
            where: { id: loanId },
            select: {
                id: true,
                loanNumber: true,
                principalAmount: true,
                interestRate: true,
                monthlyPayment: true,
                balanceRemaining: true,
                status: true,
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true
                    }
                },
                payments: {
                    where: { status: 'COMPLETED' },
                    select: {
                        id: true,
                        amount: true,
                        paymentDate: true,
                        paymentMethod: true,
                        reference: true
                    },
                    orderBy: { paymentDate: 'desc' },
                    take: 50
                }
            }
        });

        if (!loan) {
            console.error(`[PDF] Préstamo ${loanId} no disponible para este usuario.`);
            return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
        }

        // 2. Generar el binario del PDF
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 50, size: 'A4' });
                const chunks: Buffer[] = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', err => reject(err));

                // --- Cabecera ---
                doc.rect(0, 0, doc.page.width, 100).fill('#f1f5f9');
                doc.fillColor('#1e293b').fontSize(22).font('Helvetica-Bold').text(session.user.tenantName || 'EscalaFin', 50, 35);
                doc.fontSize(10).font('Helvetica').fillColor('#64748b').text('Tu Aliado Financiero', 50, 63);
                
                doc.fillColor('#0f172a').fontSize(14).font('Helvetica-Bold').text('ESTADO DE CUENTA', 350, 35, { align: 'right', width: 200 });
                doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text(`Impreso: ${new Date().toLocaleDateString('es-MX')}`, 350, 58, { align: 'right', width: 200 });
                doc.fillColor('#1e293b').font('Helvetica-Bold').text(`Folio: ${loan.loanNumber}`, 350, 70, { align: 'right', width: 200 });

                // --- Datos Cliente ---
                const top = 130;
                doc.rect(50, top, 495, 80).fill('#f8fafc');
                doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text('CLIENTE:', 65, top + 15);
                doc.fillColor('#0f172a').fontSize(12).text(`${loan.client.firstName} ${loan.client.lastName}`, 65, top + 28);
                doc.fontSize(9).font('Helvetica').text(`Tel: ${loan.client.phone || 'N/A'}`, 65, top + 45);

                doc.fillColor('#475569').fontSize(8).font('Helvetica-Bold').text('RESUMEN:', 350, top + 15);
                doc.fillColor('#1e293b').fontSize(10).font('Helvetica');
                doc.text(`Monto: $${Number(loan.principalAmount).toLocaleString()}`, 350, top + 28, { align: 'right', width: 180 });
                doc.fillColor('#2563eb').font('Helvetica-Bold').text(`Saldo: $${Number(loan.balanceRemaining).toLocaleString()}`, 350, top + 45, { align: 'right', width: 180 });

                // --- Tabla ---
                doc.y = top + 100;
                doc.fillColor('#1e293b').fontSize(12).font('Helvetica-Bold').text('HISTORIAL DE PAGOS', 50);
                doc.moveDown(1);
                
                const tableTop = doc.y;
                doc.rect(50, tableTop, 495, 20).fill('#2563eb');
                doc.fillColor('#ffffff').fontSize(8).text('FECHA', 65, tableTop + 6);
                doc.text('CONCEPTO', 150, tableTop + 6);
                doc.text('ABONO', 460, tableTop + 6, { width: 75, align: 'right' });

                let y = tableTop + 20;
                doc.font('Helvetica').fillColor('#334155').fontSize(9);

                if (loan.payments.length === 0) {
                    doc.text('No hay pagos registrados al momento.', 65, y + 10);
                } else {
                    loan.payments.forEach((p: any) => {
                        doc.text(new Date(p.paymentDate).toLocaleDateString('es-MX'), 65, y + 6);
                        doc.text(p.paymentMethod || 'Abono', 150, y + 6);
                        doc.font('Helvetica-Bold').text(`$${Number(p.amount).toLocaleString()}`, 460, y + 6, { width: 75, align: 'right' }).font('Helvetica');
                        y += 20;
                    });
                }

                doc.end();
            } catch (err) { reject(err); }
        });

        console.log(`[PDF] Éxito: ${loan.loanNumber}`);

        return new NextResponse(pdfBuffer, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `inline; filename="Estado_Cuenta_${loan.loanNumber}.pdf"`,
                'Content-Length': pdfBuffer.length.toString(),
            },
        });

    } catch (e: any) {
        console.error('❌ Error Statement API:', e);
        return NextResponse.json({ error: 'Error del servidor', details: e.message }, { status: 500 });
    }
}
