/**
 * app/api/sentinel/block-ip/route.ts
 *
 * Endpoint para bloqueo automático de IPs por Sentinel.
 * POST /api/sentinel/block-ip
 * Body: { ip: string, reason: string }
 *
 * Requiere token Sentinel. El bloqueo efectivo a nivel de red
 * se realiza via iptables/firewall externo (Coolify/nginx).
 * Este endpoint registra el evento y puede integrarse con el
 * firewall del servidor mediante scripts externos.
 */

import { NextRequest, NextResponse } from 'next/server';
import SentinelLogger               from '@/lib/sentinel-logger';

// IPs que nunca deben bloquearse (whitelist de administración)
const WHITELIST_IPS = (process.env.SENTINEL_IP_WHITELIST ?? '127.0.0.1,::1').split(',');

export async function POST(request: NextRequest) {
  // Validar token Sentinel
  const sentinelSecret = process.env.SENTINEL_SECRET;
  const providedToken  = request.headers.get('x-sentinel-token') ||
                         request.headers.get('authorization')?.replace('Bearer ', '');

  if (sentinelSecret && providedToken !== sentinelSecret) {
    return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { ip, reason } = body;

    if (!ip || !reason) {
      return NextResponse.json({ error: 'ip y reason son requeridos' }, { status: 400 });
    }

    // Verificar whitelist
    if (WHITELIST_IPS.includes(ip.trim())) {
      return NextResponse.json({
        blocked:  false,
        message:  'IP en whitelist de administración — no se puede bloquear',
        ip,
      }, { status: 200 });
    }

    // Registrar el bloqueo en audit_logs
    await SentinelLogger.logIpBlock(ip, reason, 'SENTINEL');

    // Emitir evento de seguridad al stdout (capturado por logs del contenedor)
    SentinelLogger.logSecurityEvent('IP_BLOCKED', 'HIGH', {
      ip,
      reason,
      source:     'SENTINEL',
      blocked_at: new Date().toISOString(),
    });

    // En producción: aquí se puede llamar a un script externo que ejecute
    // iptables -I INPUT -s <ip> -j DROP
    // o la API del firewall de Coolify/nginx.
    // Ejemplo: await exec(`iptables -I INPUT -s ${ip} -j DROP`);

    return NextResponse.json({
      blocked:   true,
      ip,
      reason,
      timestamp: new Date().toISOString(),
      message:   'Bloqueo registrado. El firewall externo debe procesar el log para aplicarlo.',
    });

  } catch (error) {
    console.error('[SENTINEL-BLOCK-IP] Error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
