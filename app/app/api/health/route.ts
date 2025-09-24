
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Basic health check
    const healthData = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'EscalaFin MVP',
      version: '1.0.0',
      environment: process.env.NODE_ENV || 'development'
    };

    return NextResponse.json(healthData, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'ERROR', 
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    );
  }
}
