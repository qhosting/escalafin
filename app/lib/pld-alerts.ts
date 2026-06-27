/**
 * lib/pld-alerts.ts
 *
 * Módulo PLD — Motor de Alertas y Exportador SITI
 * CNBV: Portal SITI (Sistema de Información sobre Transacciones Inusuales)
 *
 * Responsabilidades:
 * 1. Detectar operaciones inusuales (umbral SITI, liquidaciones anticipadas, estructuración)
 * 2. Crear alertas en pld_alerts con evidencia
 * 3. Generar archivos de texto estructurado con formato SITI para envío a CNBV
 *
 * Ejecutado como cronjob diario — registrado en scheduled-tasks.ts
 */

import { prisma } from './prisma';
import { AuditLogger } from './audit';
import { Decimal } from '@prisma/client/runtime/library';

// ─── Constantes SITI/CNBV ────────────────────────────────────────────────────

/**
 * Monto umbral para reportar operaciones inusuales (Art. 18 Ley PLD).
 * Para microcréditos (SOFIPO/SOCAP): MXN $7,500 por operación individual.
 * Fuente: CNBV Circular Única de Entidades de Ahorro y Crédito Popular.
 */
const SITI_THRESHOLD_MXN = 7_500;

/**
 * Porcentaje del saldo restante que, si se paga en una sola operación,
 * constituye una liquidación anticipada inusual.
 */
const EARLY_PAYOFF_THRESHOLD = 0.20; // 20% del saldo restante en un solo pago

/**
 * Versión del formato SITI. Actualizar según el manual vigente de CNBV.
 * Formato: texto de ancho fijo, delimitado por pipes |
 */
const SITI_FORMAT_VERSION = '2.0';
const SITI_ENTITY_TYPE    = 'SOFIPO'; // Tipo de entidad — ajustar según licencia

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AlertScanResult {
  thresholdAlerts:  number;
  earlyPayoffAlerts: number;
  structuringAlerts: number;
  totalAlertsCreated: number;
  tenantId: string;
  scannedAt: string;
}

export interface SitiRecord {
  folio:          string;
  tipoReporte:    string; // 'OU' = Operación Inusual
  fecha:          string; // YYYYMMDD
  nombreCliente:  string;
  curp:           string;
  monto:          string;
  moneda:         string;
  descripcion:    string;
  tipoAlerta:     string;
}

// ─── Clase principal ──────────────────────────────────────────────────────────

export class PldAlertsService {
  private auditLogger: AuditLogger;
  private tenantId: string;

  constructor(tenantId: string) {
    this.tenantId    = tenantId;
    this.auditLogger = new AuditLogger(prisma as any);
  }

  /**
   * Barre la base de datos en busca de operaciones inusuales del día anterior.
   * Llamado por el cronjob diario en scheduled-tasks.ts
   */
  async scanForAlerts(): Promise<AlertScanResult> {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [threshold, earlyPayoff, structuring] = await Promise.all([
      this.detectThresholdPayments(yesterday, today),
      this.detectEarlyPayoffs(yesterday, today),
      this.detectStructuring(yesterday, today),
    ]);

    const totalAlertsCreated = threshold + earlyPayoff + structuring;

    if (totalAlertsCreated > 0) {
      console.log(
        `[PLD-ALERTS] Tenant ${this.tenantId}: ` +
        `${totalAlertsCreated} alertas creadas ` +
        `(umbral: ${threshold}, liquidación anticipada: ${earlyPayoff}, estructuración: ${structuring})`
      );
    }

    return {
      thresholdAlerts:    threshold,
      earlyPayoffAlerts:  earlyPayoff,
      structuringAlerts:  structuring,
      totalAlertsCreated,
      tenantId: this.tenantId,
      scannedAt: new Date().toISOString(),
    };
  }

  // ─── Detección: Pagos que superan umbral SITI ─────────────────────────────

  private async detectThresholdPayments(from: Date, to: Date): Promise<number> {
    const payments = await prisma.payment.findMany({
      where: {
        tenantId: this.tenantId,
        status:   'COMPLETED',
        paymentDate: { gte: from, lt: to },
        amount:   { gte: SITI_THRESHOLD_MXN },
      },
      include: {
        loan: { include: { client: true } },
      },
    });

    let created = 0;
    for (const payment of payments) {
      // Verificar si ya existe una alerta para este pago
      const existing = await prisma.pldAlert.findFirst({
        where: {
          sourceType: 'PAYMENT',
          sourceId:   payment.id,
          alertType:  'THRESHOLD_PAYMENT',
        },
      });

      if (existing) continue;

      await prisma.pldAlert.create({
        data: {
          clientId:    payment.loan.client.id,
          tenantId:    this.tenantId,
          alertType:   'THRESHOLD_PAYMENT',
          status:      'OPEN',
          sourceType:  'PAYMENT',
          sourceId:    payment.id,
          amount:      payment.amount,
          description: `Pago único de $${Number(payment.amount).toFixed(2)} MXN supera ` +
                       `el umbral SITI de $${SITI_THRESHOLD_MXN.toLocaleString('es-MX')} MXN. ` +
                       `Préstamo: ${payment.loan.loanNumber}. ` +
                       `Cliente: ${payment.loan.client.firstName} ${payment.loan.client.lastName}.`,
          evidence: JSON.stringify({
            paymentId:    payment.id,
            loanId:       payment.loan.id,
            loanNumber:   payment.loan.loanNumber,
            amount:       Number(payment.amount),
            threshold:    SITI_THRESHOLD_MXN,
            paymentDate:  payment.paymentDate.toISOString(),
            paymentMethod: payment.paymentMethod,
          }),
        },
      });

      created++;
    }

    return created;
  }

  // ─── Detección: Liquidaciones anticipadas inusuales ───────────────────────

  private async detectEarlyPayoffs(from: Date, to: Date): Promise<number> {
    const payments = await prisma.payment.findMany({
      where: {
        tenantId: this.tenantId,
        status:   'COMPLETED',
        paymentDate: { gte: from, lt: to },
      },
      include: {
        loan: { include: { client: true } },
      },
    });

    let created = 0;
    for (const payment of payments) {
      const loan           = payment.loan;
      const balanceBefore  = Number(loan.balanceRemaining) + Number(payment.amount);
      const paymentRatio   = Number(payment.amount) / balanceBefore;

      // Si el pago cubre más del umbral del saldo restante — inusual
      if (paymentRatio < EARLY_PAYOFF_THRESHOLD) continue;
      // No aplica si el saldo era muy pequeño (últimas cuotas normales)
      if (balanceBefore < SITI_THRESHOLD_MXN / 2) continue;

      const existing = await prisma.pldAlert.findFirst({
        where: {
          sourceType: 'PAYMENT',
          sourceId:   payment.id,
          alertType:  'EARLY_PAYOFF',
        },
      });

      if (existing) continue;

      await prisma.pldAlert.create({
        data: {
          clientId:   payment.loan.client.id,
          tenantId:   this.tenantId,
          alertType:  'EARLY_PAYOFF',
          status:     'OPEN',
          sourceType: 'PAYMENT',
          sourceId:   payment.id,
          amount:     payment.amount,
          description: `Liquidación anticipada inusual: pago de $${Number(payment.amount).toFixed(2)} MXN ` +
                       `representa el ${(paymentRatio * 100).toFixed(1)}% del saldo restante ` +
                       `($${balanceBefore.toFixed(2)} MXN). ` +
                       `Préstamo: ${loan.loanNumber}.`,
          evidence: JSON.stringify({
            paymentId:     payment.id,
            loanId:        loan.id,
            loanNumber:    loan.loanNumber,
            paymentAmount: Number(payment.amount),
            balanceBefore: balanceBefore.toFixed(2),
            paymentRatio:  (paymentRatio * 100).toFixed(2) + '%',
            threshold:     (EARLY_PAYOFF_THRESHOLD * 100) + '%',
          }),
        },
      });

      created++;
    }

    return created;
  }

  // ─── Detección: Estructuración (pagos múltiples fraccionados) ─────────────

  private async detectStructuring(from: Date, to: Date): Promise<number> {
    // Buscar clientes con 3 o más pagos el mismo día
    const paymentsGrouped = await prisma.payment.groupBy({
      by:    ['loanId', 'paymentDate'],
      where: {
        tenantId: this.tenantId,
        status:   'COMPLETED',
        paymentDate: { gte: from, lt: to },
      },
      _count: { id: true },
      _sum:   { amount: true },
      having: {
        id: { _count: { gte: 3 } },
      },
    });

    let created = 0;
    for (const group of paymentsGrouped) {
      const totalAmount = Number(group._sum.amount ?? 0);

      // Solo es inusual si la suma supera el umbral (posible intento de evasión)
      if (totalAmount < SITI_THRESHOLD_MXN) continue;

      const loan = await prisma.loan.findUnique({
        where: { id: group.loanId },
        include: { client: true },
      });

      if (!loan) continue;

      const existing = await prisma.pldAlert.findFirst({
        where: {
          sourceType: 'LOAN',
          sourceId:   group.loanId,
          alertType:  'STRUCTURING_SUSPICION',
          createdAt:  { gte: from },
        },
      });

      if (existing) continue;

      await prisma.pldAlert.create({
        data: {
          clientId:   loan.client.id,
          tenantId:   this.tenantId,
          alertType:  'STRUCTURING_SUSPICION',
          status:     'OPEN',
          sourceType: 'LOAN',
          sourceId:   group.loanId,
          amount:     new Decimal(totalAmount),
          description: `Posible estructuración: ${group._count.id} pagos realizados el mismo día ` +
                       `sumando $${totalAmount.toFixed(2)} MXN en el préstamo ${loan.loanNumber}. ` +
                       `El monto total supera el umbral SITI de $${SITI_THRESHOLD_MXN.toLocaleString('es-MX')} MXN.`,
          evidence: JSON.stringify({
            loanId:         group.loanId,
            loanNumber:     loan.loanNumber,
            paymentsCount:  group._count.id,
            totalAmount:    totalAmount.toFixed(2),
            threshold:      SITI_THRESHOLD_MXN,
            date:           group.paymentDate,
          }),
        },
      });

      created++;
    }

    return created;
  }

  // ─── Exportador SITI ──────────────────────────────────────────────────────

  /**
   * Genera el archivo de texto estructurado para enviar al portal SITI de CNBV.
   * Formato: anchura fija delimitado por pipes |
   * Una línea por alerta, con header y footer.
   *
   * @param startDate - Inicio del período a reportar
   * @param endDate   - Fin del período a reportar
   * @param entityRfc - RFC de la entidad (SOFIPO/SOCAP)
   * @returns string con el contenido completo del archivo
   */
  async generateSitiFile(
    startDate: Date,
    endDate:   Date,
    entityRfc: string,
    entityName: string
  ): Promise<{ content: string; filename: string; recordCount: number }> {

    // Obtener alertas no reportadas del período
    const alerts = await prisma.pldAlert.findMany({
      where: {
        tenantId:       this.tenantId,
        reportedToSiti: false,
        status:         { in: ['OPEN', 'UNDER_REVIEW'] },
        createdAt:      { gte: startDate, lte: endDate },
      },
      include: {
        client: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    const dateStr   = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename  = `SITI_${entityRfc}_${dateStr}_OU.txt`;
    const lines: string[] = [];

    // ─── HEADER SITI ────────────────────────────────────────────────────────
    // Formato: H|RFC_ENTIDAD|NOMBRE_ENTIDAD|TIPO_ENTIDAD|FECHA_GENERACION|VERSION
    lines.push([
      'H',
      this.padRight(entityRfc, 13),
      this.padRight(entityName, 100),
      this.padRight(SITI_ENTITY_TYPE, 10),
      dateStr,
      SITI_FORMAT_VERSION,
    ].join('|'));

    // ─── REGISTROS ──────────────────────────────────────────────────────────
    for (let i = 0; i < alerts.length; i++) {
      const alert  = alerts[i];
      const client = alert.client;
      const folio  = String(i + 1).padStart(10, '0');

      // Línea de operación inusual
      // Campos según Manual SITI CNBV (adaptados a microcréditos)
      const line = [
        'D',                                                       // Tipo registro: Detalle
        this.padRight(folio, 10),                                  // Folio interno
        'OU',                                                      // Tipo: Operación Inusual
        this.formatDate(alert.createdAt),                         // Fecha de la alerta YYYYMMDD
        this.padRight(client.firstName, 50),                       // Nombre(s)
        this.padRight(client.lastName, 50),                        // Apellidos
        this.padRight(client.phone ?? '', 15),                     // Teléfono
        this.padRight('MXN', 3),                                   // Moneda
        this.padLeft(Number(alert.amount).toFixed(2), 15),         // Monto
        this.padRight(this.mapAlertTypeToSiti(alert.alertType), 5),// Tipo SITI
        this.padRight(alert.description.substring(0, 200), 200),   // Descripción
      ].join('|');

      lines.push(line);
    }

    // ─── FOOTER SITI ────────────────────────────────────────────────────────
    // Formato: T|TOTAL_REGISTROS|SUMA_MONTOS
    const totalAmount = alerts.reduce((sum, a) => sum + Number(a.amount), 0);
    lines.push([
      'T',
      String(alerts.length).padStart(10, '0'),
      totalAmount.toFixed(2).padStart(20, '0'),
    ].join('|'));

    const content = lines.join('\r\n'); // SITI usa CRLF

    // Marcar alertas como reportadas
    if (alerts.length > 0) {
      await prisma.pldAlert.updateMany({
        where: { id: { in: alerts.map(a => a.id) } },
        data: {
          reportedToSiti: true,
          sitiReportDate: new Date(),
          status:         'REPORTED_SITI',
        },
      });
    }

    // Registro de auditoría de la exportación
    await this.auditLogger.log({
      action:   'EXPORT_REPORT' as any,
      resource: 'PLD_SITI',
      details: {
        filename,
        recordCount: alerts.length,
        period:      `${startDate.toISOString()} – ${endDate.toISOString()}`,
        entityRfc,
        totalAmount: totalAmount.toFixed(2),
      },
      tenantId: this.tenantId,
      metadata: { pld_module: true, compliance: 'CNBV_SITI' },
    });

    return { content, filename, recordCount: alerts.length };
  }

  // ─── Helpers de formato SITI ──────────────────────────────────────────────

  private padRight(value: string, length: number): string {
    return value.substring(0, length).padEnd(length, ' ');
  }

  private padLeft(value: string, length: number): string {
    return value.substring(0, length).padStart(length, '0');
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0].replace(/-/g, '');
  }

  private mapAlertTypeToSiti(alertType: string): string {
    const map: Record<string, string> = {
      THRESHOLD_PAYMENT:   'OU001', // Operación inusual por monto
      EARLY_PAYOFF:        'OU002', // Liquidación anticipada
      STRUCTURING_SUSPICION: 'OU003', // Posible estructuración
      CLIENT_BLOCKED:      'OU004', // Cliente en lista negra
    };
    return map[alertType] ?? 'OU999';
  }
}

export default PldAlertsService;
