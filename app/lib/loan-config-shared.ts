
/**
 * Tipos y constantes compartidas para la configuración de préstamos.
 * Este archivo NO debe importar módulos de Node.js o servidor (redis, prisma, etc)
 * para que pueda ser utilizado de forma segura en componentes de cliente Next.js.
 */

export interface LoanTariffConfig {
    fixedFee: {
        tiers: Array<{ maxAmount: number; paymentAmount: number }>;
        overLimit: {
            baseAmount: number; 
            basePayment: number; 
            additionalStep: number; 
            additionalFee: number; 
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
