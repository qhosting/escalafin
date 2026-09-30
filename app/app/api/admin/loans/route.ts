import { NextRequest, NextResponse } from 'next/server';
import { GET as getLoans } from '@/app/api/loans/route';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return getLoans(request);
}
