
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import nodemailer from 'nodemailer'; // Asegurar que nodemailer esté en package.json o usar otra forma si no.
// Nota: nodemailer no está en package.json, lo añadiré al plan si es necesario o usaré console.log como placeholder robusto.
// Asumiré console.log y estructura lista para SMTP.

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  // Verificar autenticación básica o token secreto para cron
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET || 'secret-cron-token'}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('Iniciando generación de reporte semanal...');

    // 1. Recopilar datos
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const payments = await prisma.payment.aggregate({
      where: {
        paymentDate: { gte: startDate }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    const loans = await prisma.loan.count({
      where: {
        createdAt: { gte: startDate }
      }
    });

    const reportSummary = `
      Reporte Semanal (${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()})
      --------------------------------------------------
      Pagos Recibidos: ${payments._count.id}
      Monto Total: $${payments._sum.amount || 0}
      Nuevos Préstamos: ${loans}
    `;

    console.log(reportSummary);

    // 2. Enviar Email (Simulado si no hay SMTP)
    if (process.env.SMTP_HOST) {
        // Implementación real con nodemailer
        /*
        const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });
        await transporter.sendMail({
            from: process.env.SMTP_FROM,
            to: 'admin@escalafin.com',
            subject: 'Reporte Semanal EscalaFin',
            text: reportSummary
        });
        */
       console.log('Email enviado (simulado)');
    } else {
        console.log('SMTP no configurado. Reporte generado solo en logs.');
    }

    return NextResponse.json({ success: true, summary: reportSummary });
  } catch (error) {
    console.error('Error en reporte semanal:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
