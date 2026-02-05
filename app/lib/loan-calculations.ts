
/**
 * Utilidades para cálculos de préstamos
 * Soporta dos tipos de cálculo: Interés y Tarifa Fija
 */

import { PaymentFrequency, LoanCalculationType } from '@prisma/client';

/**
 * Calcula el número de pagos por año según la periodicidad
 */
export function getPaymentsPerYear(frequency: PaymentFrequency): number {
  switch (frequency) {
    case 'SEMANAL':
      return 52;
    case 'CATORCENAL':
      return 26;
    case 'QUINCENAL':
      return 24;
    case 'MENSUAL':
    default:
      return 12;
  }
}

/**
 * Calcula el monto de pago periódico usando el método de INTERÉS
 * Usa la fórmula de amortización estándar
 */
export function calculateInterestBasedPayment(
  principalAmount: number,
  annualInterestRate: number,
  numberOfPayments: number,
  paymentFrequency: PaymentFrequency
): number {
  if (principalAmount <= 0 || numberOfPayments <= 0) {
    return 0;
  }

  // Si no hay interés, simplemente dividir el monto entre el número de pagos
  if (annualInterestRate === 0) {
    return principalAmount / numberOfPayments;
  }

  // Convertir tasa anual a tasa periódica
  const paymentsPerYear = getPaymentsPerYear(paymentFrequency);
  const periodicRate = annualInterestRate / paymentsPerYear;

  // Fórmula de amortización: P * [r(1+r)^n] / [(1+r)^n - 1]
  const rateMultiplier = Math.pow(1 + periodicRate, numberOfPayments);
  const payment = principalAmount * (periodicRate * rateMultiplier) / (rateMultiplier - 1);

  return Math.round(payment * 100) / 100; // Redondear a 2 decimales
}

// Definición de tipos para la configuración (debe coincidir con lo que se pasa, pero para mantener independencia no importamos desde config-service, definimos interfaz local o usamos any controlado, mejor interfaz local mínima)

export interface LoanCalculationConfig {
  fixedFee?: {
    tiers: Array<{ maxAmount: number; paymentAmount: number }>;
    overLimit: {
      baseAmount: number;
      basePayment: number;
      additionalStep: number;
      additionalFee: number;
    };
  };
  weeklyInterest?: {
    rates: Array<{ amount: number; interest: number }>;
    fallback: {
      minBase: number;
      minInterest: number;
      maxBase: number;
      maxInterest: number;
    };
  };
}

/**
 * Calcula el monto de pago periódico usando el método de TARIFA FIJA
 * Sistema de tarifas escalonadas por monto prestado
 */
export function calculateFixedFeePayment(
  principalAmount: number,
  numberOfPayments: number = 16,
  config?: LoanCalculationConfig
): { paymentAmount: number; totalAmount: number; totalFee: number } {
  let totalAmount = 0;

  // Usar configuración inyectada o defaults hardcoded (legacy fallback)
  if (config?.fixedFee) {
    const { tiers, overLimit } = config.fixedFee;

    // Buscar en tiers
    const tier = tiers.find(t => principalAmount <= t.maxAmount);

    if (tier) {
      totalAmount = tier.paymentAmount * numberOfPayments;
    } else {
      // Calcular excedente
      const { baseAmount, basePayment, additionalStep, additionalFee } = overLimit;
      const remaining = principalAmount - baseAmount;
      // Evitar negativos si algo falla en la lógica de tiers
      if (remaining > 0) {
        const baseTotal = basePayment * numberOfPayments;
        const additionalSteps = Math.ceil(remaining / additionalStep);
        const extraFee = additionalSteps * additionalFee * numberOfPayments;
        totalAmount = baseTotal + extraFee;
      } else {
        // Fallback si por alguna razón no entró en tiers pero es menor a baseAmount (no debería pasar si tiers cubre hasta baseAmount)
        totalAmount = basePayment * numberOfPayments;
      }
    }
  } else {
    // --- LÓGICA HARDCODED ORIGINAL (FALLBACK) ---
    if (principalAmount <= 3000) {
      totalAmount = 300 * numberOfPayments;
    } else if (principalAmount <= 4000) {
      totalAmount = 425 * numberOfPayments;
    } else if (principalAmount <= 5000) {
      totalAmount = 600 * numberOfPayments;
    } else {
      const baseAmount = 600 * numberOfPayments;
      const additionalThousands = Math.ceil((principalAmount - 5000) / 1000);
      const additionalFee = additionalThousands * 120 * numberOfPayments;
      totalAmount = baseAmount + additionalFee;
    }
  }

  const paymentAmount = totalAmount / numberOfPayments;
  const totalFee = totalAmount - principalAmount;

  return {
    paymentAmount: Math.round(paymentAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalFee: Math.round(totalFee * 100) / 100
  };
}

/**
 * Obtiene el interés semanal en pesos según el monto prestado
 * Basado en tabla de tarifas
 */
export function getWeeklyInterestAmount(
  principalAmount: number,
  config?: LoanCalculationConfig
): number {

  if (config?.weeklyInterest) {
    const { rates, fallback } = config.weeklyInterest;

    const exactMatch = rates.find(r => r.amount === principalAmount);
    if (exactMatch) return exactMatch.interest;

    // Interpolación
    for (let i = 0; i < rates.length - 1; i++) {
      if (principalAmount > rates[i].amount && principalAmount < rates[i + 1].amount) {
        const ratio = (principalAmount - rates[i].amount) / (rates[i + 1].amount - rates[i].amount);
        const interpolated = rates[i].interest + ratio * (rates[i + 1].interest - rates[i].interest);
        return Math.round(interpolated);
      }
    }

    // Extrapolación usando fallback config
    if (principalAmount > fallback.maxBase) {
      const ratio = principalAmount / fallback.maxBase;
      return Math.round(fallback.maxInterest * ratio);
    }

    if (principalAmount < fallback.minBase) {
      const ratio = principalAmount / fallback.minBase;
      return Math.round(fallback.minInterest * ratio);
    }

    return fallback.minInterest;
  }

  // --- LÓGICA HARDCODED ORIGINAL (FALLBACK) ---
  const rates = [
    { amount: 3000, weeklyInterest: 170 },
    { amount: 4000, weeklyInterest: 200 },
    { amount: 5000, weeklyInterest: 230 },
    { amount: 6000, weeklyInterest: 260 },
    { amount: 7000, weeklyInterest: 291 },
    { amount: 8000, weeklyInterest: 320 },
    { amount: 9000, weeklyInterest: 360 },
    { amount: 10000, weeklyInterest: 400 },
  ];

  const exactMatch = rates.find(r => r.amount === principalAmount);
  if (exactMatch) {
    return exactMatch.weeklyInterest;
  }

  for (let i = 0; i < rates.length - 1; i++) {
    if (principalAmount > rates[i].amount && principalAmount < rates[i + 1].amount) {
      const ratio = (principalAmount - rates[i].amount) / (rates[i + 1].amount - rates[i].amount);
      const interpolated = rates[i].weeklyInterest + ratio * (rates[i + 1].weeklyInterest - rates[i].weeklyInterest);
      return Math.round(interpolated);
    }
  }

  if (principalAmount > 10000) {
    const ratio = principalAmount / 10000;
    return Math.round(400 * ratio);
  }

  if (principalAmount < 3000) {
    const ratio = principalAmount / 3000;
    return Math.round(170 * ratio);
  }

  return 170;
}

/**
 * Calcula el monto de pago periódico usando el método de INTERÉS SEMANAL
 * Sistema de interés semanal fijo sobre el capital
 */
export function calculateWeeklyInterestPayment(
  principalAmount: number,
  numberOfWeeks: number,
  weeklyInterestAmount?: number
): {
  paymentAmount: number;
  totalAmount: number;
  totalCharge: number;
  weeklyInterest: number;
  effectiveRate: number;
} {
  // Usar interés proporcionado o calcularlo automáticamente
  const weeklyInterest = weeklyInterestAmount || getWeeklyInterestAmount(principalAmount);

  // Calcular cargo total (interés semanal × número de semanas)
  const totalCharge = weeklyInterest * numberOfWeeks;

  // Total a pagar
  const totalAmount = principalAmount + totalCharge;

  // Pago periódico
  const paymentAmount = totalAmount / numberOfWeeks;

  // Calcular tasa efectiva anual para referencia
  const effectiveRate = (totalCharge / principalAmount) * 100;

  return {
    paymentAmount: Math.round(paymentAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    totalCharge: Math.round(totalCharge * 100) / 100,
    weeklyInterest: Math.round(weeklyInterest * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100) / 100
  };
}

/**
 * Calcula todos los datos del préstamo según el tipo de cálculo
 */
export function calculateLoanDetails(params: {
  loanCalculationType: LoanCalculationType;
  principalAmount: number;
  numberOfPayments: number;
  paymentFrequency: PaymentFrequency;
  annualInterestRate?: number;
  weeklyInterestAmount?: number;
  startDate: Date;
}): {
  paymentAmount: number;
  totalAmount: number;
  endDate: Date;
  effectiveRate?: number;
  weeklyInterest?: number;
} {
  const {
    loanCalculationType,
    principalAmount,
    numberOfPayments,
    paymentFrequency,
    annualInterestRate = 0,
    weeklyInterestAmount,
    startDate
  } = params;

  let paymentAmount = 0;
  let totalAmount = 0;
  let effectiveRate: number | undefined = undefined;
  let weeklyInterest: number | undefined = undefined;

  if (loanCalculationType === 'INTERES') {
    // Método de interés tradicional
    paymentAmount = calculateInterestBasedPayment(
      principalAmount,
      annualInterestRate,
      numberOfPayments,
      paymentFrequency
    );
    totalAmount = paymentAmount * numberOfPayments;
  } else if (loanCalculationType === 'TARIFA_FIJA') {
    // Método de tarifa fija
    const result = calculateFixedFeePayment(principalAmount, numberOfPayments);
    paymentAmount = result.paymentAmount;
    totalAmount = result.totalAmount;

    // Calcular tasa efectiva para referencia
    if (result.totalFee > 0) {
      effectiveRate = (result.totalFee / principalAmount) * 100;
    }
  } else if (loanCalculationType === 'INTERES_SEMANAL') {
    // Método de interés semanal
    const result = calculateWeeklyInterestPayment(
      principalAmount,
      numberOfPayments,
      weeklyInterestAmount
    );
    paymentAmount = result.paymentAmount;
    totalAmount = result.totalAmount;
    effectiveRate = result.effectiveRate;
    weeklyInterest = result.weeklyInterest;
  }

  // Calcular fecha de finalización
  const endDate = calculateEndDate(startDate, numberOfPayments, paymentFrequency);

  return {
    paymentAmount: Math.round(paymentAmount * 100) / 100,
    totalAmount: Math.round(totalAmount * 100) / 100,
    endDate,
    effectiveRate: effectiveRate ? Math.round(effectiveRate * 100) / 100 : undefined,
    weeklyInterest: weeklyInterest ? Math.round(weeklyInterest * 100) / 100 : undefined
  };
}

/**
 * Calcula la fecha de finalización del préstamo
 */
export function calculateEndDate(
  startDate: Date,
  numberOfPayments: number,
  paymentFrequency: PaymentFrequency
): Date {
  const endDate = new Date(startDate);

  switch (paymentFrequency) {
    case 'SEMANAL':
      endDate.setDate(endDate.getDate() + (numberOfPayments * 7));
      break;
    case 'CATORCENAL':
      endDate.setDate(endDate.getDate() + (numberOfPayments * 14));
      break;
    case 'QUINCENAL':
      endDate.setDate(endDate.getDate() + (numberOfPayments * 15));
      break;
    case 'MENSUAL':
    default:
      endDate.setMonth(endDate.getMonth() + numberOfPayments);
      break;
  }

  return endDate;
}

/**
 * Valida los parámetros del préstamo según el tipo de cálculo
 */
export function validateLoanParams(params: {
  loanCalculationType: LoanCalculationType;
  principalAmount: number;
  numberOfPayments: number;
  annualInterestRate?: number;
  weeklyInterestAmount?: number;
}): { valid: boolean; error?: string } {
  const { loanCalculationType, principalAmount, numberOfPayments, annualInterestRate, weeklyInterestAmount } = params;

  if (principalAmount <= 0) {
    return { valid: false, error: 'El monto principal debe ser mayor a 0' };
  }

  if (numberOfPayments <= 0) {
    return { valid: false, error: 'El número de pagos debe ser mayor a 0' };
  }

  if (loanCalculationType === 'INTERES') {
    if (annualInterestRate === undefined || annualInterestRate < 0) {
      return { valid: false, error: 'La tasa de interés debe ser un número válido no negativo' };
    }
  }

  // Para TARIFA_FIJA, validar que el monto esté en un rango razonable
  if (loanCalculationType === 'TARIFA_FIJA') {
    if (principalAmount < 1000) {
      return { valid: false, error: 'El monto mínimo para tarifa fija es $1,000' };
    }
    if (principalAmount > 100000) {
      return { valid: false, error: 'El monto máximo para tarifa fija es $100,000' };
    }
  }

  // Para INTERES_SEMANAL, validar rango y que tenga interés semanal
  if (loanCalculationType === 'INTERES_SEMANAL') {
    if (principalAmount < 1000) {
      return { valid: false, error: 'El monto mínimo para interés semanal es $1,000' };
    }
    if (principalAmount > 100000) {
      return { valid: false, error: 'El monto máximo para interés semanal es $100,000' };
    }
    if (weeklyInterestAmount !== undefined && weeklyInterestAmount < 0) {
      return { valid: false, error: 'El interés semanal debe ser un número válido no negativo' };
    }
  }

  return { valid: true };
}
