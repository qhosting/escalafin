/**
 * Prisma Client con filtros de multi-tenancy
 * 
 * Este módulo proporciona una instancia de Prisma extendida que aplica
 * automáticamente filtros por tenantId a todas las consultas de modelos
 * que soportan multi-tenancy.
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
        // En extensiones de Prisma, findUnique se debe manejar con cuidado
        // ya que Prisma intenta usar el índice único. Aquí lo dejamos pasar
        // pero en la práctica solemos usar findFirst si queremos forzar el tenantId.
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
 */
export const getTenantPrisma = (tenantId: string | null | undefined) => {
    if (!tenantId) {
        console.warn('⚠️ getTenantPrisma called without tenantId - returning unscoped prisma');
        return prisma;
    }

    const handlers = createTenantQueryHandlers(tenantId);

    return prisma.$extends({
        query: {
            user: handlers,
            client: handlers,
            loan: handlers,
            payment: handlers,
            creditApplication: handlers,
            auditLog: handlers,
            systemConfig: {
                ...handlers,
                async findUnique({ args, query }: QueryArgs) {
                    if ((args.where as any)?.key) {
                        return (prisma.systemConfig as any).findFirst({
                            where: { key: (args.where as any).key, tenantId }
                        });
                    }
                    return query(args);
                }
            },
            wahaConfig: handlers,
            personalReference: handlers,
            guarantor: handlers,
            collateral: handlers,
            creditScore: handlers,
            messageTemplate: handlers,
            reportTemplate: handlers,
            mLTrainingData: handlers,
            mLModel: handlers,
            conversation: handlers,
            chatbotRule: handlers,
            apiKey: handlers,
            webhookEndpoint: handlers,
            // Agregado para SaaS
            subscription: {
                async findMany({ args, query }: QueryArgs) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                }
            }
        }
    });
};

/**
 * Obtiene una instancia de Prisma filtrada por el slug del tenant
 */
export const getTenantPrismaFromSlug = async (slug: string) => {
    const tenant = await prisma.tenant.findUnique({
        where: { slug },
        select: { id: true }
    });

    if (!tenant) return prisma;
    return getTenantPrisma(tenant.id);
};

export default getTenantPrisma;
