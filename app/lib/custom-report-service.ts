/**
 * Custom Report Service - Servicio Multi-Tenant de Generación y Exportación de Reportes
 * EscalaFin
 */

import { getTenantPrisma } from '@/lib/tenant-db';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import fs from 'fs';
import path from 'path';

export interface ReportConfig {
  dataSource: 'loans' | 'payments' | 'clients' | 'collections' | 'custom';
  filters?: {
    dateFrom?: string | Date;
    dateTo?: string | Date;
    clientId?: string;
    asesorId?: string;
    status?: string;
    loanType?: string;
    [key: string]: any;
  };
  groupBy?: string[];
  aggregations?: {
    field: string;
    function: 'sum' | 'avg' | 'count' | 'min' | 'max';
  }[];
  columns?: string[];
  sortBy?: {
    field: string;
    order: 'asc' | 'desc';
  };
  limit?: number;
}

export const DEFAULT_TEMPLATES = [
  {
    name: 'Reporte General de Cartera y Préstamos',
    description: 'Resumen completo de préstamos activos, saldos pendientes y desglose por cliente.',
    category: 'cartera',
    config: JSON.stringify({
      dataSource: 'loans',
      filters: {},
      sortBy: { field: 'createdAt', order: 'desc' }
    }),
    isPublic: true
  },
  {
    name: 'Reporte de Cobranza y Pagos Recibidos',
    description: 'Detalle de pagos procesados, métodos de pago y referencias.',
    category: 'cobranza',
    config: JSON.stringify({
      dataSource: 'payments',
      filters: {},
      sortBy: { field: 'paymentDate', order: 'desc' }
    }),
    isPublic: true
  },
  {
    name: 'Reporte de Cartera en Mora / Préstamos Vencidos',
    description: 'Préstamos con atrasos o en estado mora para seguimiento de cartera vencida.',
    category: 'mora',
    config: JSON.stringify({
      dataSource: 'loans',
      filters: { status: 'DEFAULTED' },
      sortBy: { field: 'createdAt', order: 'desc' }
    }),
    isPublic: true
  },
  {
    name: 'Reporte de Clientes y Asignación de Asesores',
    description: 'Directorio de acreditados, asesor asignado, ingresos y préstamos activos.',
    category: 'clientes',
    config: JSON.stringify({
      dataSource: 'clients',
      filters: {},
      sortBy: { field: 'createdAt', order: 'desc' }
    }),
    isPublic: true
  }
];

export class CustomReportService {
  /**
   * Asegura que existan plantillas por defecto para el tenant
   */
  async ensureDefaultTemplates(tenantId: string, userId: string) {
    const tenantPrisma = getTenantPrisma(tenantId);
    const count = await (tenantPrisma as any).reportTemplate.count({
      where: { tenantId }
    });

    if (count === 0) {
      for (const tpl of DEFAULT_TEMPLATES) {
        await (tenantPrisma as any).reportTemplate.create({
          data: {
            name: tpl.name,
            description: tpl.description,
            category: tpl.category,
            config: tpl.config,
            isPublic: tpl.isPublic,
            createdBy: userId,
            tenantId
          }
        });
      }
    }
  }

  /**
   * Genera un reporte basado en una plantilla
   */
  async generateReport(
    tenantId: string,
    templateId: string,
    userId: string,
    parameters?: Record<string, any>
  ): Promise<string> {
    const tenantPrisma = getTenantPrisma(tenantId);

    const template = await (tenantPrisma as any).reportTemplate.findFirst({
      where: { id: templateId, tenantId }
    });

    if (!template) {
      throw new Error('Plantilla de reporte no encontrada para este tenant');
    }

    // Crear registro de generación
    const generation = await (tenantPrisma as any).customReportGeneration.create({
      data: {
        templateId,
        userId,
        status: 'GENERATING',
        parameters: parameters ? JSON.stringify(parameters) : null
      }
    });

    try {
      let config: ReportConfig = typeof template.config === 'string' ? JSON.parse(template.config) : template.config;

      if (parameters) {
        config.filters = { ...config.filters, ...parameters };
      }

      // Obtener datos según configuración aislados por tenant
      const data = await this.fetchData(tenantId, config);

      // Generar archivo Excel
      const filePath = await this.generateExcel(data, template.name, config);
      const fileStats = fs.statSync(filePath);

      // Actualizar generación
      await (tenantPrisma as any).customReportGeneration.update({
        where: { id: generation.id },
        data: {
          status: 'COMPLETED',
          filePath,
          fileSize: fileStats.size,
          generatedAt: new Date(),
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
      });

      return generation.id;

    } catch (error: any) {
      console.error('Error generando reporte:', error);
      await (tenantPrisma as any).customReportGeneration.update({
        where: { id: generation.id },
        data: {
          status: 'FAILED',
          errorMessage: error?.message || 'Error al generar el reporte'
        }
      });
      throw error;
    }
  }

  /**
   * Genera y retorna un Buffer directo de Excel (.xlsx)
   */
  async generateExcelBuffer(tenantId: string, config: ReportConfig, reportTitle: string): Promise<Buffer> {
    const data = await this.fetchData(tenantId, config);
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data.length > 0 ? data : [{ 'Mensaje': 'Sin datos para los filtros seleccionados' }]);

    // Ajustar anchos
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const columnWidths: any[] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = 12;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        if (cell) {
          maxWidth = Math.max(maxWidth, String(cell.v || '').length);
        }
      }
      columnWidths.push({ wch: Math.min(maxWidth + 3, 55) });
    }
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reporte');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  /**
   * Obtiene datos multi-tenant según la configuración
   */
  async fetchData(tenantId: string, config: ReportConfig): Promise<any[]> {
    const { dataSource, filters = {}, sortBy, limit } = config;

    switch (dataSource) {
      case 'loans':
        return await this.fetchLoansData(tenantId, filters, sortBy, limit);
      case 'payments':
        return await this.fetchPaymentsData(tenantId, filters, sortBy, limit);
      case 'clients':
        return await this.fetchClientsData(tenantId, filters, sortBy, limit);
      case 'collections':
        return await this.fetchCollectionsData(tenantId, filters, sortBy, limit);
      default:
        return await this.fetchLoansData(tenantId, filters, sortBy, limit);
    }
  }

  private async fetchLoansData(tenantId: string, filters: any, sortBy?: any, limit?: number) {
    const tenantPrisma = getTenantPrisma(tenantId);
    const where: any = { tenantId };

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }

    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.status && filters.status !== 'all') where.status = filters.status;
    if (filters.loanType && filters.loanType !== 'all') where.loanType = filters.loanType;

    const loans = await (tenantPrisma as any).loan.findMany({
      where,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            asesor: { select: { firstName: true, lastName: true } }
          }
        },
        payments: {
          select: {
            amount: true,
            paymentDate: true,
            status: true
          }
        }
      },
      orderBy: sortBy?.field ? { [sortBy.field]: sortBy.order } : { createdAt: 'desc' },
      take: limit || 5000
    });

    return loans.map((loan: any) => ({
      'Número de Préstamo': loan.loanNumber,
      'Cliente': `${loan.client?.firstName || ''} ${loan.client?.lastName || ''}`.trim(),
      'Teléfono': loan.client?.phone || 'N/A',
      'Asesor': loan.client?.asesor ? `${loan.client.asesor.firstName} ${loan.client.asesor.lastName}` : 'Sin Asignar',
      'Tipo de Préstamo': loan.loanType,
      'Monto Principal ($)': Number(loan.principalAmount),
      'Tasa de Interés (%)': `${Number(loan.interestRate)}%`,
      'Monto Total ($)': Number(loan.totalAmount),
      'Saldo Pendiente ($)': Number(loan.balanceRemaining),
      'Pago Cuota ($)': Number(loan.monthlyPayment),
      'Estado': loan.status === 'ACTIVE' ? 'Activo' : loan.status === 'PAID_OFF' ? 'Liquidado' : loan.status === 'DEFAULTED' ? 'En Mora' : loan.status,
      'Fecha Inicio': loan.startDate ? format(new Date(loan.startDate), 'dd/MM/yyyy', { locale: es }) : 'N/A',
      'Fecha Vencimiento': loan.endDate ? format(new Date(loan.endDate), 'dd/MM/yyyy', { locale: es }) : 'N/A',
      'Pagos Completados': loan.payments?.filter((p: any) => p.status === 'COMPLETED').length || 0,
      'Fecha Registro': format(new Date(loan.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })
    }));
  }

  private async fetchPaymentsData(tenantId: string, filters: any, sortBy?: any, limit?: number) {
    const tenantPrisma = getTenantPrisma(tenantId);
    const where: any = { tenantId };

    if (filters.dateFrom || filters.dateTo) {
      where.paymentDate = {};
      if (filters.dateFrom) where.paymentDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.paymentDate.lte = new Date(filters.dateTo);
    }

    if (filters.status && filters.status !== 'all') where.status = filters.status;
    if (filters.paymentMethod && filters.paymentMethod !== 'all') where.paymentMethod = filters.paymentMethod;

    const payments = await (tenantPrisma as any).payment.findMany({
      where,
      include: {
        loan: {
          include: {
            client: {
              select: {
                firstName: true,
                lastName: true,
                phone: true,
                asesor: { select: { firstName: true, lastName: true } }
              }
            }
          }
        },
        processedByUser: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: sortBy?.field ? { [sortBy.field]: sortBy.order } : { paymentDate: 'desc' },
      take: limit || 5000
    });

    return payments.map((payment: any) => ({
      'ID Pago': payment.id.slice(0, 8),
      'Cliente': `${payment.loan?.client?.firstName || ''} ${payment.loan?.client?.lastName || ''}`.trim(),
      'Préstamo': payment.loan?.loanNumber || 'N/A',
      'Asesor Cliente': payment.loan?.client?.asesor ? `${payment.loan.client.asesor.firstName} ${payment.loan.client.asesor.lastName}` : 'N/A',
      'Monto Pago ($)': Number(payment.amount),
      'Mora Pagada ($)': Number(payment.lateFeePaid || 0),
      'Fecha de Pago': format(new Date(payment.paymentDate), 'dd/MM/yyyy', { locale: es }),
      'Método': payment.paymentMethod,
      'Estado': payment.status,
      'Referencia / Recibo': payment.reference || 'N/A',
      'Procesado Por': payment.processedByUser ? `${payment.processedByUser.firstName} ${payment.processedByUser.lastName}` : 'Sistema',
      'Fecha Registro': format(new Date(payment.createdAt), 'dd/MM/yyyy HH:mm', { locale: es })
    }));
  }

  private async fetchClientsData(tenantId: string, filters: any, sortBy?: any, limit?: number) {
    const tenantPrisma = getTenantPrisma(tenantId);
    const where: any = { tenantId };

    if (filters.status && filters.status !== 'all') where.status = filters.status;
    if (filters.asesorId && filters.asesorId !== 'all') where.asesorId = filters.asesorId;

    const clients = await (tenantPrisma as any).client.findMany({
      where,
      include: {
        asesor: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        loans: {
          select: {
            status: true,
            balanceRemaining: true,
            principalAmount: true
          }
        },
        _count: {
          select: { loans: true }
        }
      },
      orderBy: sortBy?.field ? { [sortBy.field]: sortBy.order } : { createdAt: 'desc' },
      take: limit || 5000
    });

    return clients.map((client: any) => ({
      'ID Cliente': client.id.slice(0, 8),
      'Nombre Completo': `${client.firstName} ${client.lastName}`,
      'Teléfono': client.phone || 'N/A',
      'Email': client.email || 'N/A',
      'Ciudad': client.city || 'N/A',
      'Estado': client.state || 'N/A',
      'Banco': client.bankName || 'N/A',
      'Cuenta/CLABE': client.accountNumber || 'N/A',
      'Ingreso Mensual ($)': client.monthlyIncome ? Number(client.monthlyIncome) : 0,
      'Score Crediticio': client.creditScore || 0,
      'Asesor Asignado': client.asesor ? `${client.asesor.firstName} ${client.asesor.lastName}` : 'Sin Asignar',
      'Total Préstamos': client._count.loans,
      'Préstamos Activos': client.loans.filter((l: any) => l.status === 'ACTIVE').length,
      'Saldo Total Pendiente ($)': client.loans.reduce((sum: number, l: any) => sum + Number(l.balanceRemaining), 0),
      'Estado Cliente': client.status,
      'Fecha Registro': format(new Date(client.createdAt), 'dd/MM/yyyy', { locale: es })
    }));
  }

  private async fetchCollectionsData(tenantId: string, filters: any, sortBy?: any, limit?: number) {
    const tenantPrisma = getTenantPrisma(tenantId);
    const where: any = { tenantId };

    if (filters.dateFrom || filters.dateTo) {
      where.visitDate = {};
      if (filters.dateFrom) where.visitDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.visitDate.lte = new Date(filters.dateTo);
    }

    if (filters.advisorId && filters.advisorId !== 'all') where.advisorId = filters.advisorId;

    const visits = await (tenantPrisma as any).collectionVisit.findMany({
      where,
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            address: true
          }
        },
        advisor: {
          select: {
            firstName: true,
            lastName: true
          }
        }
      },
      orderBy: sortBy?.field ? { [sortBy.field]: sortBy.order } : { visitDate: 'desc' },
      take: limit || 5000
    });

    return visits.map((visit: any) => ({
      'ID Visita': visit.id.slice(0, 8),
      'Cliente': `${visit.client?.firstName || ''} ${visit.client?.lastName || ''}`.trim(),
      'Teléfono': visit.client?.phone || 'N/A',
      'Dirección Visita': visit.address || visit.client?.address || 'N/A',
      'Asesor': visit.advisor ? `${visit.advisor.firstName} ${visit.advisor.lastName}` : 'N/A',
      'Fecha Visita': format(new Date(visit.visitDate), 'dd/MM/yyyy HH:mm', { locale: es }),
      'Resultado': visit.outcome || 'N/A',
      'Promesa de Pago': visit.promiseDate ? format(new Date(visit.promiseDate), 'dd/MM/yyyy', { locale: es }) : 'N/A',
      'Notas': visit.notes || 'N/A'
    }));
  }

  /**
   * Genera archivo Excel en disco
   */
  private async generateExcel(data: any[], reportName: string, config: ReportConfig): Promise<string> {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(data.length > 0 ? data : [{ 'Mensaje': 'Sin registros' }]);

    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const columnWidths: any[] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = worksheet[cellAddress];
        if (cell) {
          maxWidth = Math.max(maxWidth, String(cell.v || '').length);
        }
      }
      columnWidths.push({ wch: Math.min(maxWidth + 2, 50) });
    }
    worksheet['!cols'] = columnWidths;

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

    const fileName = `${reportName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`;
    const reportsDir = path.join(process.cwd(), 'reports');

    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filePath = path.join(reportsDir, fileName);
    XLSX.writeFile(workbook, filePath);

    return filePath;
  }

  /**
   * Obtener plantillas del tenant
   */
  async getTemplates(tenantId: string, userId: string) {
    await this.ensureDefaultTemplates(tenantId, userId);
    const tenantPrisma = getTenantPrisma(tenantId);
    return (tenantPrisma as any).reportTemplate.findMany({
      where: { tenantId },
      include: {
        creator: { select: { firstName: true, lastName: true } },
        _count: { select: { generations: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
  }

  /**
   * Crear nueva plantilla de reporte
   */
  async createTemplate(
    tenantId: string,
    name: string,
    description: string,
    config: ReportConfig,
    userId: string,
    category = 'custom',
    isPublic = true
  ) {
    const tenantPrisma = getTenantPrisma(tenantId);
    return (tenantPrisma as any).reportTemplate.create({
      data: {
        name,
        description,
        category,
        config: JSON.stringify(config),
        isPublic,
        createdBy: userId,
        tenantId
      }
    });
  }

  /**
   * Obtener historial de generaciones
   */
  async getHistory(tenantId: string) {
    const tenantPrisma = getTenantPrisma(tenantId);
    return (tenantPrisma as any).customReportGeneration.findMany({
      where: { template: { tenantId } },
      include: {
        template: { select: { name: true, category: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
  }
}

export const customReportService = new CustomReportService();
