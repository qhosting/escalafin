
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth'; // Adjust path as needed
import { prisma } from '@/lib/prisma';
import PDFDocument from 'pdfkit';

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const loanId = params.id;
        const userRole = session.user.role;
        const userId = session.user.id;

        // Fetch loan details
        const loan = await prisma.loan.findUnique({
            where: { id: loanId },
            include: {
                client: true,
                payments: {
                    orderBy: { paymentDate: 'desc' }
                },
                amortizationSchedule: {
                    orderBy: { paymentNumber: 'asc' },
                    include: {
                        payment: true
                    }
                }
            }
        });

        if (!loan) {
            return new NextResponse('Loan not found', { status: 404 });
        }

        // Authorization check
        // If user is CLIENTE, they must own the loan
        // If not CLIENTE (ADMIN, ASESOR), they usually have access (assuming ASESOR access logic fits here)
        if (userRole === 'CLIENTE') {
            // Need to find the client record associated with this user to verify ownership
            // Assuming specific relation between User and Client or check if loan.client.email matches user.email if properly linked
            // Or checking if loan.clientId is linked to session user. 
            // For now, let's assume session.user.id maps to Client ID or we check via database if user is linked to client.

            // BUT, commonly in this app, Admin users have access to everything, 
            // and Client users are linked via Client model.
            // Let's perform a check: does this client exist?

            // A safer check if we don't have direct mapping in session:
            const clientUser = await prisma.client.findFirst({
                where: {
                    email: session.user.email,
                    id: loan.clientId
                }
            });

            if (!clientUser) {
                // Alternative: maybe the session.user.id IS the client id?
                // Let's stick to the email matching for safety if ids differ.
                if (loan.clientId !== userId && session.user.email !== loan.client.email) {
                    return new NextResponse('Forbidden', { status: 403 });
                }
            }
        }


        // Create PDF
        const doc = new PDFDocument({ margin: 50 });

        const chunks: Buffer[] = [];
        doc.on('data', (chunk) => chunks.push(chunk));

        // Header
        doc
            .fontSize(20)
            .text('Estado de Cuenta', { align: 'center' })
            .moveDown();

        doc
            .fontSize(12)
            .text(`EscalaFin - Tu aliado financiero`, { align: 'center' })
            .moveDown();

        // Client Info
        doc
            .fontSize(10)
            .text(`Cliente: ${loan.client.firstName} ${loan.client.lastName}`)
            .text(`Email: ${loan.client.email}`)
            .text(`Teléfono: ${loan.client.phone}`)
            .moveDown();

        // Loan Info
        doc
            .text(`Préstamo #: ${loan.loanNumber}`)
            .text(`Monto Principal: $${Number(loan.principalAmount).toFixed(2)}`)
            .text(`Saldo Restante: $${Number(loan.balanceRemaining).toFixed(2)}`)
            .text(`Estado: ${loan.status}`)
            .text(`Fecha de Inicio: ${loan.startDate.toLocaleDateString()}`)
            .text(`Fecha de Fin: ${loan.endDate.toLocaleDateString()}`)
            .moveDown();

        // Payment History Table
        doc.fontSize(14).text('Historial de Pagos', { underline: true }).moveDown(0.5);

        const tableTop = doc.y;
        const itemHeight = 20;

        // Table Headers
        doc.fontSize(10);
        doc.text('Fecha', 50, tableTop, { width: 100 });
        doc.text('Monto', 150, tableTop, { width: 100 });
        doc.text('Referencia', 250, tableTop, { width: 150 });
        doc.text('Estado', 400, tableTop, { width: 100 });

        // Draw line
        doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke();

        let recordY = tableTop + 25;

        loan.payments.forEach(payment => {
            if (recordY > 700) { // New page if near bottom
                doc.addPage();
                recordY = 50;
            }

            doc.text(payment.paymentDate.toLocaleDateString(), 50, recordY);
            doc.text(`$${Number(payment.amount).toFixed(2)}`, 150, recordY);
            doc.text(payment.notes || '-', 250, recordY);
            doc.text(payment.status, 400, recordY);

            recordY += itemHeight;
        });

        if (loan.payments.length === 0) {
            doc.text('No hay pagos registrados.', 50, recordY);
            recordY += itemHeight;
        }

        // Amortization Schedule (Optional, maybe specific request?)
        // Let's add "Próximos Pagos" (Upcoming Payments)
        doc.moveDown();
        doc.fontSize(14).text('Próximos Pagos', 50, recordY + 20, { underline: true });
        recordY += 45;

        const upcomingPayments = loan.amortizationSchedule.filter(s => !s.isPaid).slice(0, 5); // Show next 5

        doc.fontSize(10);
        doc.text('Fecha', 50, recordY, { width: 100 });
        doc.text('Monto Total', 150, recordY, { width: 100 });
        doc.text('Número', 250, recordY, { width: 100 });

        doc.moveTo(50, recordY + 15).lineTo(550, recordY + 15).stroke();
        recordY += 25;

        upcomingPayments.forEach(sch => {
            doc.text(sch.paymentDate.toLocaleDateString(), 50, recordY);
            doc.text(`$${Number(sch.totalPayment).toFixed(2)}`, 150, recordY);
            doc.text(`#${sch.paymentNumber}`, 250, recordY);
            recordY += itemHeight;
        });

        if (upcomingPayments.length === 0) {
            doc.text('No hay pagos pendientes.', 50, recordY);
        }

        doc.end();

        return new Promise<NextResponse>((resolve) => {
            doc.on('end', () => {
                const pdfData = Buffer.concat(chunks);
                const response = new NextResponse(pdfData, {
                    status: 200,
                    headers: {
                        'Content-Type': 'application/pdf',
                        'Content-Disposition': `attachment; filename="estado_cuenta_${loan.loanNumber}.pdf"`,
                    },
                });
                resolve(response);
            });

            doc.on('error', (err) => {
                console.error('PDF generation error', err);
                resolve(new NextResponse('Error generating PDF', { status: 500 }));
            });
        });

    } catch (error) {
        console.error('Error generating statement:', error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
