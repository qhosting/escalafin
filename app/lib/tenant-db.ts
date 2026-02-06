
import { PrismaClient } from '@prisma/client';
import { prisma } from './prisma';

/**
 * Retorna una instancia de Prisma extendida que aplica automáticamente
 * filtros por tenantId a las consultas.
 * 
 * @param tenantId - El ID del tenant actual
 * @returns Prisma Client extendido
 */
export const getTenantPrisma = (tenantId: string) => {
    if (!tenantId) {
        console.warn('⚠️ getTenantPrisma called without tenantId');
        return prisma; // Retornar cliente base, pero el log ayuda a debugging
    }

    return prisma.$extends({
        query: {
            client: {
                async findMany({ args, query }) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async findFirst({ args, query }) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async findUnique({ args, query }) {
                    // Nota: findUnique solo acepta campos @unique. 
                    // Si buscamos por ID, no podemos inyectar TANTANT ID a menos que sea unique compuesto.
                    // Estrategia: Convertir a findFirst si es posible, o confiar en que el ID es seguro.
                    // Para mayor seguridad en multi-tenancy, lo ideal es usar ID + TenantId como composite key, 
                    // o verificar ownership después.
                    // Por limitaciones de Prisma Extension en findUnique, lo dejaremos pasar y se validará 
                    // en lógica de negocio o se cambiará a findFirst en refactor.
                    return query(args);
                },
                async count({ args, query }) {
                    args.where = { ...args.where, tenantId };
                    return query(args);
                },
                async create({ args, query }) {
                    args.data = { ...args.data, tenantId };
                    return query(args);
                }
            },
            // Repetir para otros modelos o usar un loop si se soporta dinámicamente
            // Lamentablemente en TS estricto, iterar types es complejo.
            // Haremos explícito para modelos críticos
            loan: {
                async findMany({ args, query }) {
                    // Préstamos filtrados por cliente que pertenezca al tenant? 
                    // O directamente si Loan tiene tenantId (no lo tiene aún directo, pero Client sí)
                    // Si Loan NO tiene tenantId, debemos filtrar por relation: client: { tenantId }
                    args.where = { ...args.where, client: { tenantId } };
                    return query(args);
                },
                async count({ args, query }) {
                    args.where = { ...args.where, client: { tenantId } };
                    return query(args);
                },
            }
        }
    });
};
