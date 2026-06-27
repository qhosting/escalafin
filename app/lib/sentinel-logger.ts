/**
 * lib/sentinel-logger.ts
 *
 * Adaptador de logs estructurados para integración con el plugin Sentinel.
 * Expone métricas de rendimiento en formato JSON estructurado.
 *
 * Sentinel puede:
 * 1. Leer /api/sentinel/metrics para monitorear el sistema
 * 2. Llamar /api/sentinel/block-ip para ejecutar bloqueos automáticos
 *    (recomendado configurar un token secreto en env SENTINEL_SECRET)
 */

import { prisma } from './prisma';

// ─── Tipos de métricas ────────────────────────────────────────────────────────

export interface SentinelMetrics {
  timestamp:        string;
  service:          string;
  version:          string;
  health: {
    database:       'ok' | 'degraded' | 'down';
    application:    'ok' | 'degraded' | 'down';
    overallStatus:  'healthy' | 'degraded' | 'unhealthy';
  };
  security: {
    blockedIps:        number;
    pldAlertsOpen:     number;
    pldClientsBlocked: number;
    failedLogins24h:   number;
  };
  operations: {
    activeLoans:       number;
    overdueLoans:      number;
    paymentsToday:     number;
    pendingScreenings: number;
  };
  compliance: {
    pldAlertsUnreported: number;
    kycPending:          number;
  };
}

// ─── Clase principal ──────────────────────────────────────────────────────────

export class SentinelLogger {

  /**
   * Recopila todas las métricas del sistema para Sentinel.
   * Diseñado para ser llamado cada N minutos por el agente Sentinel.
   */
  async collectMetrics(): Promise<SentinelMetrics> {
    const [dbOk, security, operations, compliance] = await Promise.allSettled([
      this.checkDatabase(),
      this.collectSecurityMetrics(),
      this.collectOperationalMetrics(),
      this.collectComplianceMetrics(),
    ]);

    const dbHealth = dbOk.status === 'fulfilled' && dbOk.value ? 'ok' : 'down';

    const sec = security.status === 'fulfilled' ? security.value : {
      blockedIps: 0, pldAlertsOpen: 0, pldClientsBlocked: 0, failedLogins24h: 0,
    };
    const ops = operations.status === 'fulfilled' ? operations.value : {
      activeLoans: 0, overdueLoans: 0, paymentsToday: 0, pendingScreenings: 0,
    };
    const comp = compliance.status === 'fulfilled' ? compliance.value : {
      pldAlertsUnreported: 0, kycPending: 0,
    };

    const overallStatus = dbHealth === 'down' ? 'unhealthy'
      : (sec.pldAlertsOpen > 10 || sec.pldClientsBlocked > 0) ? 'degraded'
      : 'healthy';

    return {
      timestamp:   new Date().toISOString(),
      service:     'escalafin',
      version:     process.env.APP_VERSION ?? '1.0.0',
      health: {
        database:      dbHealth,
        application:   'ok',
        overallStatus,
      },
      security: sec,
      operations: ops,
      compliance: comp,
    };
  }

  // ─── Métricas de seguridad ───────────────────────────────────────────────

  private async collectSecurityMetrics() {
    const [pldAlerts, pldBlocked, failedLogins] = await Promise.all([
      prisma.pldAlert.count({ where: { status: 'OPEN' } }),
      prisma.client.count({ where: { status: 'BLOCKED_PLD' } }),
      // Contar intentos fallidos de login en las últimas 24h
      prisma.auditLog.count({
        where: {
          action:    'LOGIN',
          timestamp: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
          details:   { contains: '"success":false' },
        },
      }),
    ]);

    return {
      blockedIps:        0, // Manejado externamente por el firewall/Coolify
      pldAlertsOpen:     pldAlerts,
      pldClientsBlocked: pldBlocked,
      failedLogins24h:   failedLogins,
    };
  }

  // ─── Métricas operativas ─────────────────────────────────────────────────

  private async collectOperationalMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeLoans, overdueLoans, paymentsToday, pendingScreenings] = await Promise.all([
      prisma.loan.count({ where: { status: 'ACTIVE' } }),
      prisma.loan.count({
        where: {
          status: 'ACTIVE',
          amortizationSchedule: {
            some: { isPaid: false, paymentDate: { lt: new Date() } },
          },
        },
      }),
      prisma.payment.count({
        where: { paymentDate: { gte: today }, status: 'COMPLETED' },
      }),
      prisma.pldScreeningResult.count({ where: { status: 'PENDING' } }),
    ]);

    return { activeLoans, overdueLoans, paymentsToday, pendingScreenings };
  }

  // ─── Métricas de cumplimiento ────────────────────────────────────────────

  private async collectComplianceMetrics() {
    const [unreportedAlerts, kycPending] = await Promise.all([
      prisma.pldAlert.count({
        where: { reportedToSiti: false, status: { in: ['OPEN', 'UNDER_REVIEW'] } },
      }),
      prisma.identityVerification.count({ where: { status: 'PENDING' } }),
    ]);

    return { pldAlertsUnreported: unreportedAlerts, kycPending };
  }

  // ─── Health check de base de datos ──────────────────────────────────────

  private async checkDatabase(): Promise<boolean> {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }

  // ─── Log de evento de seguridad ──────────────────────────────────────────

  /**
   * Emite un log de seguridad estructurado para que Sentinel lo procese.
   * Formato JSON lines compatible con la mayoría de SIEMs.
   */
  static logSecurityEvent(
    event:     'BRUTE_FORCE' | 'SUSPICIOUS_LOGIN' | 'IP_BLOCKED' | 'PLD_ALERT',
    severity:  'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    details:   Record<string, unknown>
  ): void {
    const logEntry = {
      level:     'SECURITY',
      event,
      severity,
      timestamp: new Date().toISOString(),
      service:   'escalafin',
      ...details,
    };

    // Escribe al stdout en formato JSON para que Sentinel lo capture
    console.log(JSON.stringify(logEntry));
  }

  /**
   * Registra el bloqueo de una IP en el audit_log.
   * Llamado tanto por Sentinel como por el sistema internamente.
   */
  static async logIpBlock(
    ip:      string,
    reason:  string,
    source:  'SENTINEL' | 'AUTOMATIC' | 'MANUAL'
  ): Promise<void> {
    SentinelLogger.logSecurityEvent('IP_BLOCKED', 'HIGH', {
      ip, reason, source, blocked_at: new Date().toISOString(),
    });

    // Persistir en audit_logs para trazabilidad
    try {
      await prisma.auditLog.create({
        data: {
          action:   'SECURITY_BLOCK',
          resource: 'IP_ADDRESS',
          details:  JSON.stringify({ ip, reason, source }),
          metadata: JSON.stringify({ sentinel: true, auto_block: source !== 'MANUAL' }),
        },
      });
    } catch (err) {
      console.error('[SENTINEL] Error registrando bloqueo de IP:', err);
    }
  }
}

export default SentinelLogger;
