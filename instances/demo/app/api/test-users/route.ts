
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  console.log('🔍 Test users endpoint called');
  
  return NextResponse.json({ 
    message: 'Test endpoint is working',
    timestamp: new Date().toISOString(),
    path: '/api/test-users',
    status: 'success'
  });
}
