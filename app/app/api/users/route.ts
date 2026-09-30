import { NextRequest, NextResponse } from 'next/server';
import { GET as getAdminUsers } from '@/app/api/admin/users/route';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  return getAdminUsers(request);
}
