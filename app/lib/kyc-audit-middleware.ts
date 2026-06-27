/**
 * lib/kyc-audit-middleware.ts
 *
 * KYC Audit — Trazabilidad Inmutable (Patrón Observer/Interceptor)
 * CNBV: Obligación de registrar toda operación sobre datos de identidad.
 *
 * Envuelve las operaciones CRUD sobre datos KYC sensibles e intercepta
 * cada acción para generar un registro inmutable en audit_logs.
 *
 * Datos KYC protegidos:
 * - IdentityVerification (selfie, documentos, biometría)
 * - FileUpload con categoría IDENTITY_DOCUMENT
 * - Campos sensibles de Client (CURP, RFC, datos de identidad)
 *
 * El registro incluye: userId, IP, Timestamp (UTC), acción exacta, snapshot.
 */

import { prisma }               from './prisma';
import { AuditLogger }          from './audit';
import { extractRequestInfo }   from './audit';

const auditLogger = new AuditLogger(prisma as any);

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface KycAuditContext {
  userId:    string;
  userEmail: string;
  tenantId:  string;
  ipAddress: string;
  userAgent: string;
}

export interface KycSnapshot {
  before?: Record<string, unknown>;
  after?:  Record<string, unknown>;
}

// ─── Clase de middleware KYC ──────────────────────────────────────────────────

export class KycAuditMiddleware {
  private ctx: KycAuditContext;

  constructor(ctx: KycAuditContext) {
    this.ctx = ctx;
  }

  /**
   * Fábrica estática: crea el middleware a partir de una Request de Next.js y la sesión.
   */
  static fromRequest(request: Request, session: any): KycAuditMiddleware {
    const { ipAddress, userAgent } = extractRequestInfo(request);
    return new KycAuditMiddleware({
      userId:    session?.user?.id      ?? 'SYSTEM',
      userEmail: session?.user?.email   ?? 'unknown',
      tenantId:  session?.user?.tenantId ?? '',
      ipAddress,
      userAgent,
    });
  }

  // ─── Interceptores KYC ──────────────────────────────────────────────────

  /**
   * Intercepta la CREACIÓN de una verificación de identidad.
   * Llama a la función original y registra la auditoría.
   */
  async interceptCreate<T>(
    resourceType: 'IdentityVerification' | 'FileUpload',
    resourceId:   string,
    afterState:   Record<string, unknown>
  ): Promise<void> {
    await auditLogger.log({
      userId:    this.ctx.userId,
      userEmail: this.ctx.userEmail,
      tenantId:  this.ctx.tenantId,
      action:    'KYC_CREATE',
      resource:  resourceType,
      resourceId,
      ipAddress: this.ctx.ipAddress,
      userAgent: this.ctx.userAgent,
      details: {
        operation:  'CREATE',
        timestamp:  new Date().toISOString(),
        afterState: this.sanitize(afterState),
      },
      metadata: { kyc_module: true, immutable: true },
    });
  }

  /**
   * Intercepta la ACTUALIZACIÓN de datos KYC.
   * Requiere snapshot del estado antes y después para trazabilidad completa.
   */
  async interceptUpdate<T>(
    resourceType: 'IdentityVerification' | 'Client' | 'FileUpload',
    resourceId:   string,
    snapshot:     KycSnapshot
  ): Promise<void> {
    await auditLogger.log({
      userId:    this.ctx.userId,
      userEmail: this.ctx.userEmail,
      tenantId:  this.ctx.tenantId,
      action:    'KYC_UPDATE',
      resource:  resourceType,
      resourceId,
      ipAddress: this.ctx.ipAddress,
      userAgent: this.ctx.userAgent,
      details: {
        operation:   'UPDATE',
        timestamp:   new Date().toISOString(),
        beforeState: snapshot.before ? this.sanitize(snapshot.before) : undefined,
        afterState:  snapshot.after  ? this.sanitize(snapshot.after)  : undefined,
        changedFields: snapshot.before && snapshot.after
          ? this.diffFields(snapshot.before, snapshot.after)
          : [],
      },
      metadata: { kyc_module: true, immutable: true },
    });
  }

  /**
   * Intercepta la CONSULTA de datos KYC.
   * Registra quién accedió a qué información de identidad.
   */
  async interceptRead(
    resourceType: 'IdentityVerification' | 'Client' | 'FileUpload',
    resourceId:   string,
    fieldsAccessed?: string[]
  ): Promise<void> {
    await auditLogger.log({
      userId:    this.ctx.userId,
      userEmail: this.ctx.userEmail,
      tenantId:  this.ctx.tenantId,
      action:    'KYC_VIEW',
      resource:  resourceType,
      resourceId,
      ipAddress: this.ctx.ipAddress,
      userAgent: this.ctx.userAgent,
      details: {
        operation:     'READ',
        timestamp:     new Date().toISOString(),
        fieldsAccessed: fieldsAccessed ?? ['*'],
      },
      metadata: { kyc_module: true },
    });
  }

  /**
   * Intercepta INTENTOS de eliminación de datos KYC.
   * La eliminación de datos KYC está PROHIBIDA por la CNBV.
   * Registra el intento y lanza un error bloqueante.
   */
  async interceptDeleteAttempt(
    resourceType: string,
    resourceId:   string,
    reason?:      string
  ): Promise<never> {
    // Registrar el intento (inmutable)
    await auditLogger.log({
      userId:    this.ctx.userId,
      userEmail: this.ctx.userEmail,
      tenantId:  this.ctx.tenantId,
      action:    'KYC_DELETE_ATTEMPT',
      resource:  resourceType,
      resourceId,
      ipAddress: this.ctx.ipAddress,
      userAgent: this.ctx.userAgent,
      details: {
        operation:  'DELETE_ATTEMPT',
        timestamp:  new Date().toISOString(),
        reason:     reason ?? 'No especificada',
        blocked:    true,
        blockReason: 'Los datos KYC son inmutables conforme a CNBV Art. 140 BIS. ' +
                     'La eliminación de registros de verificación de identidad está prohibida.',
      },
      metadata: { kyc_module: true, security_alert: true, immutable: true },
    });

    // Bloquear la operación
    throw new Error(
      'OPERACIÓN BLOQUEADA: Los datos KYC no pueden eliminarse. ' +
      'Cumplimiento CNBV Art. 140 BIS — obligación de conservar por mínimo 5 años. ' +
      'Este intento ha sido registrado.'
    );
  }

  /**
   * Registra la VERIFICACIÓN de un KYC (aprobación o rechazo).
   */
  async interceptVerification(
    verificationId: string,
    approved:       boolean,
    verifierId:     string,
    reason?:        string
  ): Promise<void> {
    await auditLogger.log({
      userId:    this.ctx.userId,
      userEmail: this.ctx.userEmail,
      tenantId:  this.ctx.tenantId,
      action:    approved ? 'KYC_VERIFIED' : 'KYC_REJECTED',
      resource:  'IdentityVerification',
      resourceId: verificationId,
      ipAddress: this.ctx.ipAddress,
      userAgent: this.ctx.userAgent,
      details: {
        operation:  approved ? 'APPROVE' : 'REJECT',
        timestamp:  new Date().toISOString(),
        verifierId,
        reason:     reason ?? 'No especificada',
        outcome:    approved ? 'VERIFIED' : 'REJECTED',
      },
      metadata: { kyc_module: true, immutable: true },
    });
  }

  // ─── Funciones de soporte ────────────────────────────────────────────────

  /**
   * Elimina campos sensibles del snapshot antes de guardarlos en el log.
   * Las contraseñas y tokens nunca deben aparecer en audit_logs.
   */
  private sanitize(data: Record<string, unknown>): Record<string, unknown> {
    const SENSITIVE_FIELDS = [
      'password', 'passwordHash', 'twoFactorSecret', 'twoFactorBackupCodes',
      'access_token', 'refresh_token', 'id_token', 'session_state',
    ];
    const clean = { ...data };
    for (const field of SENSITIVE_FIELDS) {
      if (field in clean) clean[field] = '[REDACTED]';
    }
    return clean;
  }

  /**
   * Identifica qué campos cambiaron entre dos snapshots.
   */
  private diffFields(before: Record<string, unknown>, after: Record<string, unknown>): string[] {
    const changed: string[] = [];
    const allKeys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of allKeys) {
      if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
        changed.push(key);
      }
    }
    return changed;
  }
}

// ─── Helper: Wrapper de operaciones KYC para APIs Route Handlers ─────────────

/**
 * Utilitario de alto nivel para envolver route handlers de Next.js
 * que operan sobre datos KYC.
 *
 * Uso:
 * ```ts
 * export async function PUT(req, { params }) {
 *   return withKycAudit(req, session, 'IdentityVerification', params.id, async (middleware) => {
 *     const before = await prisma.identityVerification.findUnique(...)
 *     const updated = await prisma.identityVerification.update(...)
 *     await middleware.interceptUpdate('IdentityVerification', params.id, { before, after: updated })
 *     return NextResponse.json(updated)
 *   })
 * }
 * ```
 */
export async function withKycAudit<T>(
  request: Request,
  session: any,
  operation: 'CREATE' | 'UPDATE' | 'READ' | 'DELETE',
  resourceType: string,
  resourceId:   string,
  fn: (middleware: KycAuditMiddleware) => Promise<T>
): Promise<T> {
  const middleware = KycAuditMiddleware.fromRequest(request, session);

  if (operation === 'DELETE') {
    await middleware.interceptDeleteAttempt(resourceType, resourceId);
  }

  return fn(middleware);
}

export default KycAuditMiddleware;
