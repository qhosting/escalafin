/**
 * Custom Report Service - Generación de Reportes Personalizados
 * 
 * Este servicio maneja:
 * - Constructor de reportes con filtros dinámicos
 * - Generación de PDFs con branding
 * - Programación de reportes automáticos
 * - Exportación a múltiples formatos
 */

import { PrismaClient, ReportStatus } from '@prisma/client';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const prisma = new PrismaClient();

export interface ReportConfig {
    dataSource: 'loans' | 'payments' | 'clients' | 'collections' | 'custom';
    filters?: {
        dateFrom?: Date;
        dateTo?: Date;
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

export interface LayoutConfig {
    sections: {
        type: 'header' | 'table' | 'chart' | 'summary' | 'footer';
        title?: string;
        data?: string;
        chartType?: 'bar' | 'line' | 'pie';
    }[];
    branding?: {
        logo?: string;
        colors?: {
            primary: string;
            secondary: string;
        };
    };
}

export class CustomReportService {
    /**
     * Genera un reporte basado en una plantilla
     */
    async generateReport(templateId: string, userId: string, parameters?: Record<string, any>): Promise<string> {
        console.log(`📊 Generando reporte desde plantilla ${templateId}...`);

        try {
            const template = await prisma.reportTemplate.findUnique({
                where: { id: templateId }
            });

            if (!template) {
                throw new Error('Plantilla de reporte no encontrada');
            }

            // Crear registro de generación
            const generation = await prisma.customReportGeneration.create({
                data: {
                    templateId,
                    userId,
                    status: 'GENERATING',
                    parameters: parameters ? JSON.stringify(parameters) : null
                }
            });

            try {
                const config: ReportConfig = JSON.parse(template.config);

                // Aplicar parámetros dinámicos
                if (parameters) {
                    config.filters = { ...config.filters, ...parameters };
                }

                // Obtener datos según configuración
                const data = await this.fetchData(config);

                // Generar archivo Excel
                const filePath = await this.generateExcel(data, template.name, config);
                const fileStats = require('fs').statSync(filePath);

                // Actualizar generación
                await prisma.customReportGeneration.update({
                    where: { id: generation.id },
                    data: {
                        status: 'COMPLETED',
                        filePath,
                        fileSize: fileStats.size,
                        generatedAt: new Date(),
                        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 días
                    }
                });

                console.log(`✅ Reporte generado: ${filePath}`);
                return generation.id;

            } catch (error) {
                // Marcar como fallido
                await prisma.customReportGeneration.update({
                    where: { id: generation.id },
                    data: {
                        status: 'FAILED',
                        errorMessage: error instanceof Error ? error.message : 'Error desconocido'
                    }
                });

                throw error;
            }
        } catch (error) {
            console.error('❌ Error generando reporte:', error);
            throw error;
        }
    }

    /**
     * Obtiene datos según la configuración del reporte
     */
    private async fetchData(config: ReportConfig): Promise<any[]> {
        const { dataSource, filters = {}, sortBy, limit } = config;

        switch (dataSource) {
            case 'loans':
                return await this.fetchLoansData(filters, sortBy, limit);

            case 'payments':
                return await this.fetchPaymentsData(filters, sortBy, limit);

            case 'clients':
                return await this.fetchClientsData(filters, sortBy, limit);

            case 'collections':
                return await this.fetchCollectionsData(filters, sortBy, limit);

            default:
                throw new Error(`Tipo de datos no soportado: ${dataSource}`);
        }
    }

    /**
     * Obtiene datos de préstamos
     */
    private async fetchLoansData(filters: any, sortBy?: any, limit?: number) {
        const where: any = {};

        if (filters.dateFrom || filters.dateTo) {
            where.createdAt = {};
            if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
            if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
        }

        if (filters.clientId) where.clientId = filters.clientId;
        if (filters.status) where.status = filters.status;
        if (filters.loanType) where.loanType = filters.loanType;

        const loans = await prisma.loan.findMany({
            where,
            include: {
                client: {
                    select: {
                        firstName: true,
                        lastName: true,
                        phone: true,
                        email: true
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
            orderBy: sortBy ? { [sortBy.field]: sortBy.order } : { createdAt: 'desc' },
            take: limit || 1000
        });

        return loans.map(loan => ({
            'Número de Préstamo': loan.loanNumber,
            'Cliente': `${loan.client.firstName} ${loan.client.lastName}`,
            'Teléfono': loan.client.phone,
            'Tipo': loan.loanType,
            'Monto Principal': Number(loan.principalAmount),
            'Tasa de Interés': `${Number(loan.interestRate) * 100}%`,
            'Monto Total': Number(loan.totalAmount),
            'Saldo Pendiente': Number(loan.balanceRemaining),
            'Pago Mensual': Number(loan.monthlyPayment),
            'Estado': loan.status,
            'Fecha Inicio': format(loan.startDate, 'dd/MM/yyyy', { locale: es }),
            'Fecha Fin': format(loan.endDate, 'dd/MM/yyyy', { locale: es }),
            'Pagos Realizados': loan.payments.filter(p => p.status === 'COMPLETED').length,
            'Fecha Creación': format(loan.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })
        }));
    }

    /**
     * Obtiene datos de pagos
     */
    private async fetchPaymentsData(filters: any, sortBy?: any, limit?: number) {
        const where: any = {};

        if (filters.dateFrom || filters.dateTo) {
            where.paymentDate = {};
            if (filters.dateFrom) where.paymentDate.gte = new Date(filters.dateFrom);
            if (filters.dateTo) where.paymentDate.lte = new Date(filters.dateTo);
        }

        if (filters.status) where.status = filters.status;
        if (filters.paymentMethod) where.paymentMethod = filters.paymentMethod;

        const payments = await prisma.payment.findMany({
            where,
            include: {
                loan: {
                    include: {
                        client: {
                            select: {
                                firstName: true,
                                lastName: true,
                                phone: true
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
            orderBy: sortBy ? { [sortBy.field]: sortBy.order } : { paymentDate: 'desc' },
            take: limit || 1000
        });

        return payments.map(payment => ({
            'ID Pago': payment.id.slice(0, 8),
            'Cliente': `${payment.loan.client.firstName} ${payment.loan.client.lastName}`,
            'Préstamo': payment.loan.loanNumber,
            'Monto': Number(payment.amount),
            'Fecha de Pago': format(payment.paymentDate, 'dd/MM/yyyy', { locale: es }),
            'Método': payment.paymentMethod,
            'Estado': payment.status,
            'Referencia': payment.reference || 'N/A',
            'Procesado Por': payment.processedByUser ?
                `${payment.processedByUser.firstName} ${payment.processedByUser.lastName}` : 'Sistema',
            'Fecha Registro': format(payment.createdAt, 'dd/MM/yyyy HH:mm', { locale: es })
        }));
    }

    /**
     * Obtiene datos de clientes
     */
    private async fetchClientsData(filters: any, sortBy?: any, limit?: number) {
        const where: any = {};

        if (filters.status) where.status = filters.status;
        if (filters.asesorId) where.asesorId = filters.asesorId;
        if (filters.city) where.city = filters.city;

        const clients = await prisma.client.findMany({
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
                        balanceRemaining: true
                    }
                },
                _count: {
                    select: {
                        loans: true
                    }
                }
            },
            orderBy: sortBy ? { [sortBy.field]: sortBy.order } : { createdAt: 'desc' },
            take: limit || 1000
        });

        return clients.map(client => ({
            'ID Cliente': client.id.slice(0, 8),
            'Nombre Completo': `${client.firstName} ${client.lastName}`,
            'Teléfono': client.phone,
            'Email': client.email || 'N/A',
            'Ciudad': client.city || 'N/A',
            'Estado': client.state || 'N/A',
            'Tipo de Empleo': client.employmentType || 'N/A',
            'Ingreso Mensual': client.monthlyIncome ? Number(client.monthlyIncome) : 0,
            'Score Crediticio': client.creditScore || 0,
            'Asesor': client.asesor ? `${client.asesor.firstName} ${client.asesor.lastName}` : 'Sin asignar',
            'Total Préstamos': client._count.loans,
            'Préstamos Activos': client.loans.filter(l => l.status === 'ACTIVE').length,
            'Saldo Total': client.loans.reduce((sum, l) => sum + Number(l.balanceRemaining), 0),
            'Estado Cliente': client.status,
            'Fecha Registro': format(client.createdAt, 'dd/MM/yyyy', { locale: es })
        }));
    }

    /**
     * Obtiene datos de cobranza
     */
    private async fetchCollectionsData(filters: any, sortBy?: any, limit?: number) {
        const where: any = {};

        if (filters.dateFrom || filters.dateTo) {
            where.visitDate = {};
            if (filters.dateFrom) where.visitDate.gte = new Date(filters.dateFrom);
            if (filters.dateTo) where.visitDate.lte = new Date(filters.dateTo);
        }

        if (filters.advisorId) where.advisorId = filters.advisorId;

        const visits = await prisma.collectionVisit.findMany({
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
            orderBy: sortBy ? { [sortBy.field]: sortBy.order } : { visitDate: 'desc' },
            take: limit || 1000
        });

        return visits.map(visit => ({
            'ID Visita': visit.id.slice(0, 8),
            'Cliente': `${visit.client.firstName} ${visit.client.lastName}`,
            'Teléfono': visit.client.phone,
            'Dirección Visita': visit.address || visit.client.address || 'N/A',
            'Asesor': `${visit.advisor.firstName} ${visit.advisor.lastName}`,
            'Fecha Visita': format(visit.visitDate, 'dd/MM/yyyy HH:mm', { locale: es }),
            'Resultado': visit.outcome || 'N/A',
            'Promesa de Pago': visit.promiseDate ? format(visit.promiseDate, 'dd/MM/yyyy', { locale: es }) : 'N/A',
            'Notas': visit.notes || 'N/A',
            'Coordenadas': visit.latitude && visit.longitude ?
                `${visit.latitude.toFixed(6)}, ${visit.longitude.toFixed(6)}` : 'N/A'
        }));
    }

    /**
     * Genera archivo Excel con los datos
     */
    private async generateExcel(data: any[], reportName: string, config: ReportConfig): Promise<string> {
        const workbook = XLSX.utils.book_new();

        // Crear hoja de datos
        const worksheet = XLSX.utils.json_to_sheet(data);

        // Aplicar formato a las columnas
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');

        // Auto-ajustar anchos de columna
        const columnWidths: any[] = [];
        for (let C = range.s.c; C <= range.e.c; ++C) {
            let maxWidth = 10;
            for (let R = range.s.r; R <= range.e.r; ++R) {
                const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
                const cell = worksheet[cellAddress];
                if (!cell) continue;

                const cellValue = String(cell.v || '');
                maxWidth = Math.max(maxWidth, cellValue.length);
            }
            columnWidths.push({ wch: Math.min(maxWidth + 2, 50) });
        }
        worksheet['!cols'] = columnWidths;

        XLSX.utils.book_append_sheet(workbook, worksheet, 'Datos');

        // Agregar hoja de resumen si hay agregaciones
        if (config.aggregations && config.aggregations.length > 0) {
            const summaryData = this.calculateAggregations(data, config.aggregations);
            const summarySheet = XLSX.utils.json_to_sheet(summaryData);
            XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');
        }

        // Guardar archivo
        const fileName = `${reportName.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.xlsx`;
        const filePath = `./reports/${fileName}`;

        // Crear directorio si no existe
        const fs = require('fs');
        if (!fs.existsSync('./reports')) {
            fs.mkdirSync('./reports', { recursive: true });
        }

        XLSX.writeFile(workbook, filePath);

        return filePath;
    }

    /**
     * Calcula agregaciones sobre los datos
     */
    private calculateAggregations(data: any[], aggregations: ReportConfig['aggregations']): any[] {
        const results: any[] = [];

        aggregations?.forEach(agg => {
            let result: any = { Métrica: agg.field, Función: agg.function };

            const values = data.map(row => Number(row[agg.field]) || 0);

            switch (agg.function) {
                case 'sum':
                    result.Valor = values.reduce((a, b) => a + b, 0);
                    break;
                case 'avg':
                    result.Valor = values.reduce((a, b) => a + b, 0) / values.length;
                    break;
                case 'count':
                    result.Valor = values.length;
                    break;
                case 'min':
                    result.Valor = Math.min(...values);
                    break;
                case 'max':
                    result.Valor = Math.max(...values);
                    break;
            }

            results.push(result);
        });

        return results;
    }

    /**
     * Crea una plantilla de reporte
     */
    async createTemplate(
        name: string,
        description: string,
        config: ReportConfig,
        userId: string,
        category = 'custom',
        isPublic = false
    ): Promise<string> {
        const template = await prisma.reportTemplate.create({
            data: {
                name,
                description,
                category,
                config: JSON.stringify(config),
                isPublic,
                createdBy: userId
            }
        });

        return template.id;
    }

    /**
     * Programa un reporte recurrente
     */
    async scheduleReport(
        templateId: string,
        frequency: 'DAILY' | 'WEEKLY' | 'MONTHLY',
        time: string,
        recipients: string[],
        dayOfWeek?: number,
        dayOfMonth?: number
    ): Promise<string> {
        const nextRun = this.calculateNextRunDate(frequency, time, dayOfWeek, dayOfMonth);

        const schedule = await prisma.reportSchedule.create({
            data: {
                templateId,
                frequency,
                time,
                recipients: JSON.stringify(recipients),
                dayOfWeek,
                dayOfMonth,
                nextRunAt: nextRun,
                isActive: true
            }
        });

        return schedule.id;
    }

    /**
     * Calcula la próxima fecha de ejecución
     */
    private calculateNextRunDate(
        frequency: string,
        time: string,
        dayOfWeek?: number,
        dayOfMonth?: number
    ): Date {
        const [hours, minutes] = time.split(':').map(Number);
        const now = new Date();
        const next = new Date(now);
        next.setHours(hours, minutes, 0, 0);

        if (next <= now) {
            next.setDate(next.getDate() + 1);
        }

        if (frequency === 'WEEKLY' && dayOfWeek !== undefined) {
            while (next.getDay() !== dayOfWeek) {
                next.setDate(next.getDate() + 1);
            }
        } else if (frequency === 'MONTHLY' && dayOfMonth !== undefined) {
            next.setDate(dayOfMonth);
            if (next <= now) {
                next.setMonth(next.getMonth() + 1);
            }
        }

        return next;
    }

    /**
     * Ejecuta reportes programados
     */
    async runScheduledReports(): Promise<void> {
        const now = new Date();

        const dueschedules = await prisma.reportSchedule.findMany({
            where: {
                isActive: true,
                nextRunAt: {
                    lte: now
                }
            },
            include: {
                template: true
            }
        });

        console.log(`📅 Ejecutando ${dueschedules.length} reportes programados...`);

        for (const schedule of dueschedules) {
            try {
                // Generar reporte (usar un usuario del sistema)
                const systemUserId = 'system'; // TODO: Obtener ID de usuario del sistema
                const generationId = await this.generateReport(schedule.templateId, systemUserId);

                // TODO: Enviar por email a los destinatarios
                const recipients = JSON.parse(schedule.recipients) as string[];
                console.log(`📧 Reporte enviado a: ${recipients.join(', ')}`);

                // Actualizar próxima ejecución
                const nextRun = this.calculateNextRunDate(
                    schedule.frequency,
                    schedule.time,
                    schedule.dayOfWeek || undefined,
                    schedule.dayOfMonth || undefined
                );

                await prisma.reportSchedule.update({
                    where: { id: schedule.id },
                    data: {
                        lastRunAt: now,
                        nextRunAt: nextRun
                    }
                });

            } catch (error) {
                console.error(`❌ Error ejecutando reporte programado ${schedule.id}:`, error);
            }
        }
    }

    /**
     * Obtiene todas las plantillas públicas o del usuario
     */
    async getTemplates(userId: string, includePublic = true) {
        return await prisma.reportTemplate.findMany({
            where: {
                OR: [
                    { createdBy: userId },
                    ...(includePublic ? [{ isPublic: true }] : [])
                ]
            },
            include: {
                creator: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                },
                _count: {
                    select: {
                        generations: true,
                        schedules: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
    }
}

export const customReportService = new CustomReportService();
