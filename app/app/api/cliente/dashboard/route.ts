import { NextRequest, NextResponse } from 'next/server';
import { GET as getClientStats } from '@/app/api/dashboard/client-stats/route';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return getClientStats();
}
