
import { NextRequest, NextResponse } from 'next/server';
import { customReportService } from '@/lib/custom-report-service';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await customReportService.runScheduledReports();
    return NextResponse.json({ success: true, message: 'Scheduled reports processed' });
  } catch (error) {
    console.error('Reports Cron Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
