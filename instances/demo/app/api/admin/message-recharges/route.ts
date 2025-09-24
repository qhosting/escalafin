// ARCHIVO TEMPORALMENTE DESHABILITADO - MessageRecharge model no existe en Prisma schema
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  return NextResponse.json({ error: 'Funcionalidad temporalmente deshabilitada' }, { status: 503 });
}

export async function POST(request: NextRequest) {
  return NextResponse.json({ error: 'Funcionalidad temporalmente deshabilitada' }, { status: 503 });
}