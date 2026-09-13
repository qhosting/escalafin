
import { NextRequest, NextResponse } from 'next/server';
import { customReportService } from '@/lib/custom-report-service';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  // Fail-closed: sin CRON_SECRET configurado el endpoint queda cerrado, no abierto.
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    const result = await customReportService.runScheduledReports();
    return NextResponse.json({ success: true, message: 'Scheduled reports processed', ...result });
  } catch (error) {
    console.error('Reports Cron Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
