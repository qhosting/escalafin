
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { AuditLogger } from '@/lib/audit';
import { redisCache } from '@/lib/redis-cache';

export async function POST(req: NextRequest) {
  try {
    // 🛡️ Seguridad interna básica
    const internalSecret = req.headers.get('x-internal-secret');
    if (internalSecret !== process.env.NEXTAUTH_SECRET) {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const { ip, userAgent, path, pattern } = await req.json();

    // 1. Incrementar contador de intentos en Redis
    const attemptKey = `sec:att:${ip}`;
    const banKey = `sec:ban:${ip}`;
    
    const attempts = await redisCache.increment(attemptKey);
    // Establecer expiración (1 hora) en el primer intento
    if (attempts === 1) {
      await redisCache.expire(attemptKey, 3600);
    }

    let isBanning = false;
    if (attempts >= 5) {
      // 2. Banear IP por 24 horas si excede 5 intentos
      await redisCache.set(banKey, {
        bannedAt: new Date().toISOString(),
        reason: 'Demasiados intentos de inyección detectados',
        lastPattern: pattern
      }, 86400); // 24 horas
      isBanning = true;
    }

    // 3. Registrar en AuditLog
    const auditLogger = new AuditLogger(prisma);
    await auditLogger.log({
      action: 'SECURITY_BLOCK',
      resource: isBanning ? 'IP_BAN_SYSTEM' : 'NETWORK_WAF',
      ipAddress: ip,
      userAgent: userAgent,
      details: {
        blockedPath: path,
        detectedPattern: pattern,
        attempts: attempts,
        isBannedNow: isBanning,
        timestamp: new Date().toISOString()
      }
    });

    return NextResponse.json({ 
      success: true, 
      attempts, 
      isBanned: isBanning 
    });
  } catch (error) {
    console.error('Error recording security log:', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}
