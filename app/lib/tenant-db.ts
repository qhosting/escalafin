
import { prisma } from '@/lib/prisma';

/**
 * Retorna una instancia de Prisma extendida que aplica automáticamente
 * filtros por tenantId a las consultas.
 * 
 * @param tenantId - El ID del tenant actual
 * @returns Prisma Client extendido
 */
export const getTenantPrisma = (tenantId: string | null | undefined) => {
    if (!tenantId) {
        console.warn('⚠️ getTenantPrisma called without tenantId');
        return prisma;
    }

    const tenantFilter = { tenantId };

    return prisma.$extends({
        query: {
            user: {
                async findMany({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async findFirst({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async count({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, ...tenantFilter };
                    return query(args);
                }
            },
            client: {
                async findMany({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async findFirst({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async count({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, ...tenantFilter };
                    return query(args);
                }
            },
            loan: {
                async findMany({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async findFirst({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async count({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async aggregate({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async groupBy({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, ...tenantFilter };
                    return query(args);
                }
            },
            payment: {
                async findMany({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async findFirst({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async count({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async aggregate({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, ...tenantFilter };
                    return query(args);
                }
            },
            creditApplication: {
                async findMany({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async findFirst({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async count({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, ...tenantFilter };
                    return query(args);
                }
            },
            auditLog: {
                async findMany({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async count({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, ...tenantFilter };
                    return query(args);
                }
            },
            systemConfig: {
                async findMany({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async findFirst({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async findUnique({ args, query }) {
                    if ((args.where as any).key) {
                        return (prisma.systemConfig as any).findFirst({
                            where: { key: (args.where as any).key, tenantId }
                        });
                    }
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, ...tenantFilter };
                    return query(args);
                },
                async update({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                }
            },
            personalReference: {
                async findMany({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async count({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, ...tenantFilter };
                    return query(args);
                }
            },
            guarantor: {
                async findFirst({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, ...tenantFilter };
                    return query(args);
                }
            },
            collateral: {
                async findMany({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, ...tenantFilter };
                    return query(args);
                }
            },
            creditScore: {
                async findMany({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async findFirst({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, ...tenantFilter };
                    return query(args);
                }
            },
            messageTemplate: {
                async findMany({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async findFirst({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, ...tenantFilter };
                    return query(args);
                }
            },
            reportTemplate: {
                async findMany({ args, query }) {
                    args.where = { ...args.where, ...tenantFilter };
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, ...tenantFilter };
                    return query(args);
                }
            }
        }
    });
};
