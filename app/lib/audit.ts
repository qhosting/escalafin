
import { PrismaClient } from '@prisma/client';

export type AuditAction = 
  | 'LOGIN' | 'LOGOUT' | 'SIGNUP'
  | 'LOAN_CREATE' | 'LOAN_UPDATE' | 'LOAN_DELETE' | 'LOAN_APPROVE' | 'LOAN_REJECT'
  | 'PAYMENT_CREATE' | 'PAYMENT_UPDATE' | 'PAYMENT_PROCESS'
  | 'USER_CREATE' | 'USER_UPDATE' | 'USER_DELETE'
  | 'EXPORT_REPORT' | 'VIEW_REPORT'
  | 'SYSTEM_CONFIG_CREATE' | 'SYSTEM_CONFIG_UPDATE'
  | 'FILE_UPLOAD' | 'FILE_DELETE'
  | 'NOTIFICATION_SEND'
  | 'SCORING_CALCULATE'
  | 'WEBHOOK_RECEIVED' | 'WEBHOOK_ERROR';

export interface AuditLogData {
  userId?: string;
  userEmail?: string;
  action: AuditAction;
  resource?: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, any>;
}

export interface AuditLogFilter {
  userId?: string;
  action?: AuditAction;
  resource?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export class AuditLogger {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async log(logData: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: logData.userId,
          userEmail: logData.userEmail || undefined,
          action: logData.action,
          resource: logData.resource || undefined,
          resourceId: logData.resourceId || undefined,
          details: logData.details ? JSON.stringify(logData.details) : undefined,
          ipAddress: logData.ipAddress || undefined,
          userAgent: logData.userAgent || undefined,
          metadata: logData.metadata ? JSON.stringify(logData.metadata) : undefined,
          timestamp: new Date(),
        },
      });
    } catch (error) {
      console.error('Error logging audit entry:', error);
      // No lanzamos el error para no afectar el flujo principal
    }
  }

  async getLogs(filter: AuditLogFilter = {}) {
    const where: any = {};
    
    if (filter.userId) where.userId = filter.userId;
    if (filter.action) where.action = filter.action;
    if (filter.resource) where.resource = filter.resource;
    if (filter.startDate || filter.endDate) {
      where.timestamp = {};
      if (filter.startDate) where.timestamp.gte = filter.startDate;
      if (filter.endDate) where.timestamp.lte = filter.endDate;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: filter.limit || 50,
      skip: filter.offset || 0,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  async getLogStats(startDate: Date, endDate: Date) {
    const logs = await this.prisma.auditLog.findMany({
      where: {
        timestamp: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        action: true,
        userId: true,
        timestamp: true,
      },
    });

    // Agrupar por acción
    const actionStats = logs.reduce((acc, log) => {
      acc[log.action] = (acc[log.action] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Agrupar por usuario
    const userStats = logs.reduce((acc, log) => {
      if (log.userId) {
        acc[log.userId] = (acc[log.userId] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    // Agrupar por día
    const dailyStats = logs.reduce((acc, log) => {
      const day = log.timestamp.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      totalLogs: logs.length,
      actionStats,
      userStats,
      dailyStats,
      topActions: Object.entries(actionStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
      topUsers: Object.entries(userStats)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 10),
    };
  }
}

// Helper function para obtener IP y User-Agent desde request
export function extractRequestInfo(request: Request) {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               'unknown',
    userAgent: request.headers.get('user-agent') || 'unknown',
  };
}

// Middleware helper para logging automático
export function createAuditMiddleware(auditLogger: AuditLogger) {
  return {
    logSuccess: (action: AuditAction, userId?: string, details?: Record<string, any>) => {
      return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
        const method = descriptor.value;
        descriptor.value = async function (...args: any[]) {
          try {
            const result = await method.apply(this, args);
            await auditLogger.log({
              userId,
              action,
              details,
              resource: target.constructor.name,
            });
            return result;
          } catch (error) {
            throw error;
          }
        };
      };
    },
  };
}
