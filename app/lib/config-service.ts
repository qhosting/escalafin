import { getTenantPrisma } from './tenant-db';
import { redisCache, CACHE_TTL } from './redis-cache';
import { LoanTariffConfig, DEFAULT_LOAN_TARIFFS } from './loan-config-shared';



const CONFIG_KEY = 'LOAN_TARIFF_CONFIG';

export class ConfigService {

    /**
     * Obtiene la configuración de tarifas de préstamo.
     * Si no existe, la crea con los valores por defecto PARA EL TENANT ESPECIFICADO.
     */
    static async getLoanTariffs(tenantId: string): Promise<LoanTariffConfig> {
        if (!tenantId) return DEFAULT_LOAN_TARIFFS;

        const cacheKey = `config:${tenantId}:${CONFIG_KEY}`;

        return redisCache.remember(
            cacheKey,
            CACHE_TTL.HOUR,
            async () => {
                try {
                    const db = getTenantPrisma(tenantId);

                    const config = await db.systemConfig.findFirst({
                        where: { key: CONFIG_KEY }
                    });

                    if (config) {
                        return JSON.parse(config.value) as LoanTariffConfig;
                    }

                    // Si no existe, crearla para este tenant
                    await db.systemConfig.create({
                        data: {
                            key: CONFIG_KEY,
                            value: JSON.stringify(DEFAULT_LOAN_TARIFFS),
                            description: 'Configuración dinámica de tarifas y tasas de interés',
                            category: 'LOANS'
                        }
                    });

                    return DEFAULT_LOAN_TARIFFS;
                } catch (error) {
                    console.error('Error obteniendo configuración de tarifas:', error);
                    return DEFAULT_LOAN_TARIFFS;
                }
            }
        );
    }

    /**
     * Actualiza la configuración de tarifas.
     */
    static async updateLoanTariffs(tenantId: string, newConfig: LoanTariffConfig, userId?: string): Promise<void> {
        if (!tenantId) throw new Error('TenantID requerido para actualizar configuración');

        const db = getTenantPrisma(tenantId);
        const cacheKey = `config:${tenantId}:${CONFIG_KEY}`;

        const existing = await db.systemConfig.findFirst({
            where: { key: CONFIG_KEY }
        });

        if (existing) {
            await db.systemConfig.update({
                where: { id: existing.id },
                data: {
                    value: JSON.stringify(newConfig),
                    updatedBy: userId
                }
            });
        } else {
            await db.systemConfig.create({
                data: {
                    key: CONFIG_KEY,
                    value: JSON.stringify(newConfig),
                    description: 'Configuración dinámica de tarifas y tasas de interés',
                    category: 'LOANS',
                    updatedBy: userId
                }
            });
        }

        // Invalidar cache
        await redisCache.del(cacheKey);
    }
}
