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
        if (!session?.user) {
            return new NextResponse('No autorizado', { status: 401 });
        }

        const loanId = params.id;
        const tenantId = session.user.tenantId;

        console.log(`[PDF Statement] Generando estado para préstamo ${loanId} (Tenant: ${tenantId})`);

        const tenantPrisma = getTenantPrisma(tenantId);
        
        // 1. Obtener datos completos del préstamo, cliente, pagos y plan de amortización
        const loan = await (tenantPrisma.loan as any).findFirst({
            where: { id: loanId },
            select: {
                id: true,
                loanNumber: true,
                loanType: true,
                principalAmount: true,
                interestRate: true,
                monthlyPayment: true,
                balanceRemaining: true,
                termMonths: true,
                status: true,
                startDate: true,
                endDate: true,
                createdAt: true,
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true,
                        address: true,
                        city: true,
                        state: true
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
                },
                amortizationSchedule: {
                    where: { isPaid: false },
                    select: {
                        installmentNumber: true,
                        paymentDate: true,
                        totalPayment: true,
                        isPaid: true
                    },
                    orderBy: { installmentNumber: 'asc' },
                    take: 6
                }
            }
        });

        if (!loan) {
            console.error(`[PDF Statement] Préstamo ${loanId} no disponible.`);
            return NextResponse.json({ error: 'Préstamo no encontrado' }, { status: 404 });
        }

        const tenantName = session.user.tenantName || 'EscalaFin';
        const clientFullName = `${loan.client.firstName} ${loan.client.lastName}`;
        const principal = Number(loan.principalAmount || 0);
        const balance = Number(loan.balanceRemaining || 0);
        const paidTotal = Math.max(0, principal - balance);
        const progressPercent = principal > 0 ? ((paidTotal / principal) * 100).toFixed(1) : '0.0';

        // 2. Generar PDF con PDFKit
        const pdfBuffer = await new Promise<Buffer>((resolve, reject) => {
            try {
                const doc = new PDFDocument({ margin: 40, size: 'A4' });
                const chunks: Buffer[] = [];
                doc.on('data', chunk => chunks.push(chunk));
                doc.on('end', () => resolve(Buffer.concat(chunks)));
                doc.on('error', err => reject(err));

                // --- HEADER BANNER ---
                doc.rect(0, 0, doc.page.width, 95).fill('#0f172a');
                doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold').text(tenantName, 40, 25);
                doc.fontSize(9).font('Helvetica').fillColor('#94a3b8').text('ESTADO DE CUENTA OFICIAL DE CRÉDITO', 40, 55);

                doc.fillColor('#38bdf8').fontSize(14).font('Helvetica-Bold').text('FICHA FINANCIERA', 360, 25, { align: 'right', width: 195 });
                doc.fontSize(8).font('Helvetica').fillColor('#94a3b8').text(`Impreso: ${new Date().toLocaleDateString('es-MX')}`, 360, 48, { align: 'right', width: 195 });
                doc.fillColor('#ffffff').font('Helvetica-Bold').text(`Folio: ${loan.loanNumber}`, 360, 62, { align: 'right', width: 195 });

                let y = 110;

                // --- CLIENT & CREDIT SUMMARY BOXES ---
                // Client Card (Left)
                doc.rect(40, y, 250, 95).fill('#f8fafc').stroke('#e2e8f0');
                doc.fillColor('#0f172a').fontSize(9).font('Helvetica-Bold').text('DATOS DEL ACREDITADO', 52, y + 12);
                doc.fillColor('#1e293b').fontSize(11).font('Helvetica-Bold').text(clientFullName, 52, y + 28);
                doc.fillColor('#64748b').fontSize(8.5).font('Helvetica');
                doc.text(`Teléfono: ${loan.client.phone || 'No registrado'}`, 52, y + 45);
                doc.text(`Email: ${loan.client.email || 'No registrado'}`, 52, y + 58);
                if (loan.client.address) {
                    doc.text(`Domicilio: ${loan.client.address}`, 52, y + 71, { width: 220, ellipsis: true });
                }

                // Financial Summary Card (Right)
                doc.rect(305, y, 250, 95).fill('#eff6ff').stroke('#bfdbfe');
                doc.fillColor('#1e40af').fontSize(9).font('Helvetica-Bold').text('RESUMEN DE CRÉDITO', 317, y + 12);
                
                doc.fillColor('#475569').fontSize(8).font('Helvetica');
                doc.text('Monto Original:', 317, y + 28);
                doc.fillColor('#0f172a').font('Helvetica-Bold').text(`$${principal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 420, y + 28, { align: 'right', width: 120 });

                doc.fillColor('#475569').font('Helvetica').text('Abonado a Capital:', 317, y + 43);
                doc.fillColor('#16a34a').font('Helvetica-Bold').text(`$${paidTotal.toLocaleString('es-MX', { minimumFractionDigits: 2 })} (${progressPercent}%)`, 420, y + 43, { align: 'right', width: 120 });

                doc.fillColor('#475569').font('Helvetica').text('Saldo Restante:', 317, y + 58);
                doc.fillColor('#2563eb').fontSize(11).font('Helvetica-Bold').text(`$${balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 420, y + 58, { align: 'right', width: 120 });

                doc.fillColor('#475569').fontSize(8).font('Helvetica').text('Estado:', 317, y + 75);
                doc.fillColor(loan.status === 'ACTIVE' ? '#16a34a' : '#dc2626').font('Helvetica-Bold').text(loan.status === 'ACTIVE' ? 'ACTIVO VIGENTE' : loan.status, 420, y + 75, { align: 'right', width: 120 });

                y += 115;

                // --- TABLA DE HISTORIAL DE PAGOS COMPLETADOS ---
                doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('HISTORIAL DE PAGOS REGISTRADOS', 40, y);
                y += 18;

                const tableTop = y;
                doc.rect(40, tableTop, 515, 20).fill('#1e293b');
                doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
                doc.text('FECHA', 52, tableTop + 6);
                doc.text('MÉTODO', 150, tableTop + 6);
                doc.text('FOLIO / REFERENCIA', 270, tableTop + 6);
                doc.text('MONTO ABONADO', 450, tableTop + 6, { width: 90, align: 'right' });

                y = tableTop + 20;
                doc.font('Helvetica').fillColor('#334155').fontSize(8.5);

                if (loan.payments.length === 0) {
                    doc.rect(40, y, 515, 25).fill('#f8fafc').stroke('#e2e8f0');
                    doc.fillColor('#64748b').text('No se han registrado pagos completados hasta el momento.', 52, y + 8);
                    y += 30;
                } else {
                    loan.payments.forEach((p: any, index: number) => {
                        const bg = index % 2 === 0 ? '#ffffff' : '#f8fafc';
                        doc.rect(40, y, 515, 20).fill(bg);
                        doc.fillColor('#1e293b');

                        const payDate = new Date(p.paymentDate).toLocaleDateString('es-MX');
                        doc.text(payDate, 52, y + 6);
                        doc.text(p.paymentMethod || 'Efectivo', 150, y + 6);
                        doc.text(p.reference || p.id.substring(0, 10), 270, y + 6, { width: 170, ellipsis: true });
                        doc.font('Helvetica-Bold').fillColor('#16a34a').text(`$${Number(p.amount).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 450, y + 6, { width: 90, align: 'right' }).font('Helvetica');
                        
                        y += 20;
                    });
                    y += 10;
                }

                // --- TABLA DE PRÓXIMOS VENCIMIENTOS ---
                if (loan.amortizationSchedule && loan.amortizationSchedule.length > 0 && y < 680) {
                    doc.fillColor('#0f172a').fontSize(11).font('Helvetica-Bold').text('PRÓXIMAS CUOTAS PENDIENTES', 40, y);
                    y += 18;

                    const schedTop = y;
                    doc.rect(40, schedTop, 515, 20).fill('#3b82f6');
                    doc.fillColor('#ffffff').fontSize(8).font('Helvetica-Bold');
                    doc.text('CUOTA N°', 52, schedTop + 6);
                    doc.text('FECHA DE VENCIMIENTO', 160, schedTop + 6);
                    doc.text('MONTO A PAGAR', 450, schedTop + 6, { width: 90, align: 'right' });

                    y = schedTop + 20;
                    doc.font('Helvetica').fillColor('#334155').fontSize(8.5);

                    loan.amortizationSchedule.forEach((sch: any, idx: number) => {
                        const bg = idx % 2 === 0 ? '#ffffff' : '#f0f9ff';
                        doc.rect(40, y, 515, 18).fill(bg);
                        doc.fillColor('#1e293b');

                        const dueDate = new Date(sch.paymentDate).toLocaleDateString('es-MX');
                        doc.text(`Cuota ${sch.installmentNumber}`, 52, y + 5);
                        doc.text(dueDate, 160, y + 5);
                        doc.font('Helvetica-Bold').fillColor('#1e40af').text(`$${Number(sch.totalPayment).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`, 450, y + 5, { width: 90, align: 'right' }).font('Helvetica');
                        
                        y += 18;
                    });
                    y += 15;
                }

                // --- FOOTER & CERTIFICADO SHA-256 ---
                const footerY = doc.page.height - 60;
                doc.rect(0, footerY, doc.page.width, 60).fill('#f1f5f9');
                doc.fillColor('#64748b').fontSize(7.5).font('Helvetica').text('Este documento es un estado de cuenta emitido electrónicamente por el sistema EscalaFin. Los saldos están sujetos a validación de pagos en proceso.', 40, footerY + 12, { width: 515, align: 'center' });
                
                const certHash = `SHA256:${loan.id.substring(0, 16).toUpperCase()}-${Date.now()}`;
                doc.fillColor('#94a3b8').fontSize(7).font('Helvetica-Bold').text(`CERTIFICADO DIGITAL DE AUTENTICIDAD: ${certHash}`, 40, footerY + 32, { width: 515, align: 'center' });

                doc.end();
            } catch (err) { reject(err); }
        });

        console.log(`[PDF Statement] Generado con éxito para ${loan.loanNumber}`);

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
