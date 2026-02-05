
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface LoanTariffConfig {
    fixedFee: {
        tiers: Array<{ maxAmount: number; paymentAmount: number }>;
        overLimit: {
            baseAmount: number; // 5000
            basePayment: number; // 600
            additionalStep: number; // 1000
            additionalFee: number; // 120
        };
    };
    weeklyInterest: {
        rates: Array<{ amount: number; interest: number }>;
        fallback: {
            minBase: number;
            minInterest: number;
            maxBase: number;
            maxInterest: number;
        };
    };
}

export const DEFAULT_LOAN_TARIFFS: LoanTariffConfig = {
    fixedFee: {
        tiers: [
            { maxAmount: 3000, paymentAmount: 300 },
            { maxAmount: 4000, paymentAmount: 425 },
            { maxAmount: 5000, paymentAmount: 600 }
        ],
        overLimit: {
            baseAmount: 5000,
            basePayment: 600,
            additionalStep: 1000,
            additionalFee: 120
        }
    },
    weeklyInterest: {
        rates: [
            { amount: 3000, interest: 170 },
            { amount: 4000, interest: 200 },
            { amount: 5000, interest: 230 },
            { amount: 6000, interest: 260 },
            { amount: 7000, interest: 291 },
            { amount: 8000, interest: 320 },
            { amount: 9000, interest: 360 },
            { amount: 10000, interest: 400 },
        ],
        fallback: {
            minBase: 3000,
            minInterest: 170,
            maxBase: 10000,
            maxInterest: 400
        }
    }
};

const CONFIG_KEY = 'LOAN_TARIFF_CONFIG';

export class ConfigService {

    /**
     * Obtiene la configuración de tarifas de préstamo.
     * Si no existe, la crea con los valores por defecto.
     */
    static async getLoanTariffs(): Promise<LoanTariffConfig> {
        try {
            const config = await prisma.systemConfig.findUnique({
                where: { key: CONFIG_KEY }
            });

            if (config) {
                return JSON.parse(config.value) as LoanTariffConfig;
            }

            // Si no existe, crearla
            await prisma.systemConfig.create({
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
            return DEFAULT_LOAN_TARIFFS; // Fallback seguro
        }
    }

    /**
     * Actualiza la configuración de tarifas.
     */
    static async updateLoanTariffs(newConfig: LoanTariffConfig, userId?: string): Promise<void> {
        await prisma.systemConfig.upsert({
            where: { key: CONFIG_KEY },
            update: {
                value: JSON.stringify(newConfig),
                updatedBy: userId
            },
            create: {
                key: CONFIG_KEY,
                value: JSON.stringify(newConfig),
                description: 'Configuración dinámica de tarifas y tasas de interés',
                category: 'LOANS',
                updatedBy: userId
            }
        });
    }
}
