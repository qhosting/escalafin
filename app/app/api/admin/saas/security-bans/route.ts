
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { redisCache } from '@/lib/redis-cache';
import { AuditLogger } from '@/lib/audit';

// Obtiene la lista de IPs baneadas desde Redis (basado en keys de patrones)
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return new NextResponse('No autorizado', { status: 401 });
    }

    // Buscamos todas las keys de baneo en Redis: sec:ban:*
    // En Node-Redis client.keys() funciona, pero redisCache es un wrapper 
    // que usa client.isAlive etc. Revisemos si RedisCacheService tiene keys.
    // Usamos client directo si es posible... 
    // ... pero redisCacheService es privado.
    // Bueno, podemos usar AuditLog para obtener las IPs que se banearon y 
    // luego cruzarlas con Redis si queremos saber si continúan baneadas.
    
    // Mejor: Obtener logs con RESOURCE: 'IP_BAN_SYSTEM'
    const auditLogger = new AuditLogger(prisma);
    const logs = await auditLogger.getLogs({
      action: 'SECURITY_BLOCK',
      resource: 'IP_BAN_SYSTEM',
      limit: 100
    });

    // Añadimos información de si la IP sigue baneada activamente en Redis
    const bans = await Promise.all(logs.map(async (log: any) => {
        const isBanned = await redisCache.exists(`sec:ban:${log.ipAddress}`);
        const ttl = isBanned ? await redisCache.ttl(`sec:ban:${log.ipAddress}`) : 0;
        return {
            id: log.id,
            ip: log.ipAddress,
            userAgent: log.userAgent,
            bannedAt: log.timestamp,
            isActive: isBanned,
            ttl: ttl,
            details: log.details ? JSON.parse(log.details) : {}
        };
    }));

    return NextResponse.json({ bans });
  } catch (error) {
    console.error('Error fetching banned IPs:', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}

// Desbloquear (Desbanear) una IP
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'SUPER_ADMIN') {
      return new NextResponse('No autorizado', { status: 401 });
    }

    const { ip } = await req.json();
    if (!ip) return new NextResponse('Falta IP', { status: 400 });

    const banKey = `sec:ban:${ip}`;
    const attemptKey = `sec:att:${ip}`;

    await redisCache.del(banKey);
    await redisCache.del(attemptKey);

    const auditLogger = new AuditLogger(prisma);
    await auditLogger.log({
        userId: session.user.id,
        userEmail: session.user.email,
        action: 'SECURITY_BLOCK',
        resource: 'IP_UNBAN',
        ipAddress: ip,
        details: {
            unbannedBy: session.user.email,
            unbannedAt: new Date().toISOString()
        }
    });

    return NextResponse.json({ success: true, message: `IP ${ip} desbloqueada.` });
  } catch (error) {
    console.error('Error unbanning IP:', error);
    return new NextResponse('Error interno', { status: 500 });
  }
}
