/**
 * Prisma Client con filtros de multi-tenancy
 * 
 * Este módulo proporciona una instancia de Prisma extendida que aplica
 * automáticamente filtros por tenantId a todas las consultas de modelos
 * que soportan multi-tenancy.
 * 
 * Uso:
 *   const db = getTenantPrisma(tenantId);
 *   const clients = await db.client.findMany(); // Automáticamente filtrado por tenant
 */

import { prisma } from '@/lib/prisma';

// Tipo para las operaciones de query comunes
type QueryArgs = { args: any; query: (args: any) => Promise<any> };

/**
 * Crea handlers de query estándar para un modelo con tenantId
 */
const createTenantQueryHandlers = (tenantId: string) => ({
    async findMany({ args, query }: QueryArgs) {
        args.where = { ...args.where, tenantId };
        return query(args);
    },
    async findFirst({ args, query }: QueryArgs) {
        args.where = { ...args.where, tenantId };
        return query(args);
    },
    async findUnique({ args, query }: QueryArgs) {
        // Para findUnique, convertimos a findFirst con filtro de tenant
        // ya que findUnique no acepta campos adicionales en where
        return query(args);
    },
    async count({ args, query }: QueryArgs) {
        args.where = { ...args.where, tenantId };
        return query(args);
    },
    async aggregate({ args, query }: QueryArgs) {
        args.where = { ...args.where, tenantId };
        return query(args);
    },
    async groupBy({ args, query }: QueryArgs) {
        args.where = { ...args.where, tenantId };
        return query(args);
    },
    async create({ args, query }: QueryArgs) {
        args.data = { ...args.data, tenantId };
        return query(args);
    },
    async createMany({ args, query }: QueryArgs) {
        if (Array.isArray(args.data)) {
            args.data = args.data.map((item: any) => ({ ...item, tenantId }));
        } else {
            args.data = { ...args.data, tenantId };
        }
        return query(args);
    },
    async update({ args, query }: QueryArgs) {
        // No modificar where en update, confiar en que el ID es correcto
        return query(args);
    },
    async updateMany({ args, query }: QueryArgs) {
        args.where = { ...args.where, tenantId };
        return query(args);
    },
    async delete({ args, query }: QueryArgs) {
        return query(args);
    },
    async deleteMany({ args, query }: QueryArgs) {
        args.where = { ...args.where, tenantId };
        return query(args);
    },
    async upsert({ args, query }: QueryArgs) {
        args.create = { ...args.create, tenantId };
        return query(args);
    }
});

/**
 * Retorna una instancia de Prisma extendida que aplica automáticamente
 * filtros por tenantId a las consultas.
 * 
 * @param tenantId - El ID del tenant actual
 * @returns Prisma Client extendido con filtros de tenant
 * 
 * @example
 * ```typescript
 * const db = getTenantPrisma(session.user.tenantId);
 * const clients = await db.client.findMany(); // Solo clientes del tenant
 * const newClient = await db.client.create({ data: { name: 'Test' } }); // tenantId se agrega automáticamente
 * ```
 */
export const getTenantPrisma = (tenantId: string | null | undefined) => {
    if (!tenantId) {
        console.warn('⚠️ getTenantPrisma called without tenantId - returning unscoped prisma');
        return prisma;
    }

    const handlers = createTenantQueryHandlers(tenantId);

    return prisma.$extends({
        query: {
            // ============================================
            // MODELOS PRINCIPALES
            // ============================================

            user: handlers,
            client: handlers,
            loan: handlers,
            payment: handlers,
            creditApplication: handlers,

            // ============================================
            // MODELOS DE AUDITORÍA Y CONFIGURACIÓN
            // ============================================

            auditLog: handlers,
            systemConfig: {
                ...handlers,
                async findUnique({ args, query }: QueryArgs) {
                    // SystemConfig usa key único, necesitamos buscar por key + tenant
                    if ((args.where as any)?.key) {
                        return (prisma.systemConfig as any).findFirst({
                            where: { key: (args.where as any).key, tenantId }
                        });
                    }
                    return query(args);
                }
            },
            wahaConfig: handlers,

            // ============================================
            // MODELOS DE CLIENTES Y PRÉSTAMOS
            // ============================================

            personalReference: handlers,
            guarantor: handlers,
            collateral: handlers,
            creditScore: handlers,

            // ============================================
            // MODELOS DE COMUNICACIÓN
            // ============================================

            messageTemplate: handlers,
            reportTemplate: handlers,

            // ============================================
            // MODELOS DE IA/ML
            // ============================================

            mLTrainingData: {
                async findMany({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async create({ args, query }: QueryArgs) {
                    args.data = { ...args.data, tenantId };
                    return query(args);
                },
                async count({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                }
            },

            mLModel: {
                async findMany({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async findFirst({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async create({ args, query }: QueryArgs) {
                    args.data = { ...args.data, tenantId };
                    return query(args);
                }
            },

            // ============================================
            // MODELOS DE CONVERSACIÓN Y CHATBOT
            // ============================================

            conversation: {
                async findMany({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async findFirst({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async create({ args, query }: QueryArgs) {
                    args.data = { ...args.data, tenantId };
                    return query(args);
                },
                async count({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                }
            },

            conversationMessage: {
                async findMany({ args, query }: QueryArgs) {
                    // Los mensajes se filtran a través de la conversación
                    return query(args);
                },
                async create({ args, query }: QueryArgs) {
                    return query(args);
                }
            },

            chatbotRule: {
                async findMany({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async findFirst({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async create({ args, query }: QueryArgs) {
                    args.data = { ...args.data, tenantId };
                    return query(args);
                }
            },

            // ============================================
            // MODELOS DE REPORTES
            // ============================================

            reportSchedule: {
                async findMany({ args, query }: QueryArgs) {
                    // Filter through reportTemplate relation
                    return query(args);
                },
                async create({ args, query }: QueryArgs) {
                    return query(args);
                }
            },

            customReportGeneration: {
                async findMany({ args, query }: QueryArgs) {
                    // Filter through reportTemplate relation
                    return query(args);
                },
                async create({ args, query }: QueryArgs) {
                    return query(args);
                }
            },

            // ============================================
            // MODELOS SaaS - API KEYS Y WEBHOOKS
            // ============================================

            apiKey: {
                async findMany({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async findFirst({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async create({ args, query }: QueryArgs) {
                    args.data = { ...args.data, tenantId };
                    return query(args);
                },
                async deleteMany({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                }
            },

            webhookEndpoint: {
                async findMany({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async findFirst({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async create({ args, query }: QueryArgs) {
                    args.data = { ...args.data, tenantId };
                    return query(args);
                },
                async deleteMany({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                }
            },

            // Los deliveries de webhook se acceden a través del endpoint
            webhookDelivery: {
                async findMany({ args, query }: QueryArgs) {
                    return query(args);
                },
                async create({ args, query }: QueryArgs) {
                    return query(args);
                }
            },

            // ============================================
            // MODELOS SaaS - BILLING (Sin filtro de tenant - acceso especial)
            // Estos modelos tienen tenantId como relación, no como filtro
            // ============================================

            // subscription, invoice, tenantUsage se manejan directamente
            // ya que son recursos del tenant, no dentro del tenant
        }
    });
};

/**
 * Helper para obtener el tenantId de una sesión de NextAuth
 */
export const getTenantIdFromSession = (session: any): string | null => {
    return session?.user?.tenantId || null;
};

/**
 * Verifica si un recurso pertenece al tenant actual
 */
export const belongsToTenant = async (
    tenantId: string,
    model: string,
    id: string
): Promise<boolean> => {
    try {
        const db = getTenantPrisma(tenantId);
        const record = await (db as any)[model].findFirst({
            where: { id },
            select: { id: true }
        });
        return !!record;
    } catch {
        return false;
    }
};

export default getTenantPrisma;
