
import { NextRequest, NextResponse } from 'next/server';
import { mlTrainingService } from '@/lib/ml-training-service';

export async function GET(request: NextRequest) {
  // Verificar secret para seguridad en cron jobs
  const authHeader = request.headers.get('authorization');
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    await mlTrainingService.monthlyRetraining();
    return NextResponse.json({ success: true, message: 'Monthly ML retraining completed' });
  } catch (error) {
    console.error('ML Cron Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
