/**
 * lib/pld-risk-scoring.ts
 *
 * Módulo PLD — Matriz de Riesgo para Onboarding
 * CNBV: Disposiciones de PLD para Entidades de Ahorro y Crédito Popular
 *
 * Calcula un score de riesgo PLD automático durante el registro de clientes
 * evaluando: edad, código postal (zona geográfica) y actividad económica.
 */

import { prisma } from './prisma';

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type PldRiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface PldRiskFactors {
  /** Edad del cliente en años */
  age: number;
  /** Código postal (5 dígitos) */
  postalCode: string;
  /** Tipo de empleo/actividad económica */
  employmentType: string;
  /** Ingreso mensual declarado (MXN) */
  monthlyIncome: number;
}

export interface PldRiskResult {
  /** Score 0–100: mayor score = mayor riesgo */
  score: number;
  /** Nivel de riesgo normalizado */
  riskLevel: PldRiskLevel;
  /** Factores individuales para trazabilidad */
  factors: {
    ageScore: number;
    geographicScore: number;
    economicActivityScore: number;
    incomeScore: number;
  };
  /** Recomendación de acción */
  recommendation: 'PROCEED' | 'ENHANCED_DUE_DILIGENCE' | 'REJECT';
  /** Razón legible */
  reason: string;
}

// ─── Catálogos de riesgo ─────────────────────────────────────────────────────

/**
 * Prefijos de códigos postales de alta actividad criminal reportada por la UIF.
 * Se basa en las zonas de mayor incidencia según reportes públicos CNBV.
 * Actualizar periódicamente con base en las listas vigentes de la UIF.
 */
const HIGH_RISK_POSTAL_PREFIXES: string[] = [
  '06', '07', '08', '09', // CDMX zonas de alta incidencia
  '44', '45', '46',       // Jalisco zonas reportadas
  '64', '66',             // Nuevo León zonas reportadas
  '31', '32',             // Chihuahua frontera norte
  '88', '89',             // Tamaulipas frontera norte
];

const MEDIUM_RISK_POSTAL_PREFIXES: string[] = [
  '01', '02', '03', '04', '05', // CDMX zonas medias
  '14', '15', '16',             // CDMX sur
  '50', '52', '53',             // Estado de México
];

/**
 * Actividades económicas de alto riesgo PLD según FATF/GAFI y CNBV.
 */
const HIGH_RISK_ACTIVITIES = [
  'SELF_EMPLOYED', // Comercio informal — difícil trazabilidad de ingresos
];

const MEDIUM_RISK_ACTIVITIES = [
  'UNEMPLOYED',
];

// ─── Clase principal ──────────────────────────────────────────────────────────

export class PldRiskScoringService {

  /**
   * Calcula el score de riesgo PLD.
   * Retorna un objeto con el score, nivel de riesgo y factores detallados.
   */
  calculateRiskScore(factors: PldRiskFactors): PldRiskResult {
    const ageScore           = this.scoreAge(factors.age);
    const geographicScore    = this.scoreGeography(factors.postalCode);
    const economicScore      = this.scoreEconomicActivity(factors.employmentType);
    const incomeScore        = this.scoreIncome(factors.monthlyIncome);

    // Ponderación: geografía y actividad económica tienen mayor peso PLD
    const weightedScore = Math.round(
      ageScore           * 0.15 +
      geographicScore    * 0.35 +
      economicScore      * 0.30 +
      incomeScore        * 0.20
    );

    const { riskLevel, recommendation, reason } = this.classify(weightedScore);

    return {
      score: weightedScore,
      riskLevel,
      factors: {
        ageScore,
        geographicScore,
        economicActivityScore: economicScore,
        incomeScore,
      },
      recommendation,
      reason,
    };
  }

  // ─── Funciones de scoring individual ─────────────────────────────────────

  private scoreAge(age: number): number {
    // Menores y personas de edad muy avanzada = mayor vigilancia
    if (age < 18)              return 90; // No debería llegar aquí (validación previa)
    if (age >= 18 && age < 21) return 50; // Jóvenes adultos — riesgo moderado
    if (age >= 21 && age < 65) return 10; // Rango estándar — bajo riesgo
    if (age >= 65)             return 25; // Adultos mayores — atención a tutores
    return 30;
  }

  private scoreGeography(postalCode: string): number {
    if (!postalCode || postalCode.length < 2) return 40;

    const prefix = postalCode.substring(0, 2);

    if (HIGH_RISK_POSTAL_PREFIXES.includes(prefix))   return 80;
    if (MEDIUM_RISK_POSTAL_PREFIXES.includes(prefix)) return 40;
    return 15; // Resto del país — riesgo base
  }

  private scoreEconomicActivity(employmentType: string): number {
    if (HIGH_RISK_ACTIVITIES.includes(employmentType))   return 70;
    if (MEDIUM_RISK_ACTIVITIES.includes(employmentType)) return 50;
    // EMPLOYED, RETIRED, STUDENT
    return 15;
  }

  private scoreIncome(monthlyIncome: number): number {
    // Ingresos muy bajos pueden indicar incompatibilidad con montos solicitados
    // Ingresos muy altos sin justificación pueden ser señal de lavado
    if (monthlyIncome <= 0)             return 70; // Sin ingresos declarados
    if (monthlyIncome < 3_000)          return 50; // Muy bajo
    if (monthlyIncome >= 3_000  && monthlyIncome < 30_000) return 10; // Rango normal
    if (monthlyIncome >= 30_000 && monthlyIncome < 100_000) return 25; // Alto
    if (monthlyIncome >= 100_000)       return 60; // Muy alto — requiere fuente documentada
    return 30;
  }

  private classify(score: number): {
    riskLevel: PldRiskLevel;
    recommendation: PldRiskResult['recommendation'];
    reason: string;
  } {
    if (score <= 25) {
      return {
        riskLevel: 'LOW',
        recommendation: 'PROCEED',
        reason: 'Perfil de riesgo bajo. Proceder con el proceso estándar de alta.',
      };
    }
    if (score <= 55) {
      return {
        riskLevel: 'MEDIUM',
        recommendation: 'ENHANCED_DUE_DILIGENCE',
        reason:
          'Perfil de riesgo moderado. Aplicar Debida Diligencia Reforzada (DDR): ' +
          'solicitar documentación adicional de fuente de ingresos y comprobante de domicilio actualizado.',
      };
    }
    return {
      riskLevel: 'HIGH',
      recommendation: 'REJECT',
      reason:
        'Perfil de riesgo alto. El cliente no cumple con los criterios mínimos de ' +
        'aceptación PLD. Se requiere revisión manual por el Oficial de Cumplimiento ' +
        'antes de proceder con cualquier operación.',
    };
  }

  /**
   * Ejecuta el scoring y persiste el resultado en credit_scores con metadata PLD.
   * Útil para auditoría y trazabilidad del proceso de onboarding.
   */
  async scoreAndPersist(
    clientId: string,
    factors: PldRiskFactors,
    tenantId: string
  ): Promise<PldRiskResult & { persistedId: string }> {
    const result = this.calculateRiskScore(factors);

    // Guardar en credit_scores con marcador PLD en factors
    const pldFactors = JSON.stringify({
      pld_module: true,
      pld_risk_level: result.riskLevel,
      pld_recommendation: result.recommendation,
      age_score:              result.factors.ageScore,
      geographic_score:       result.factors.geographicScore,
      economic_activity_score: result.factors.economicActivityScore,
      income_score:           result.factors.incomeScore,
    });

    const saved = await prisma.creditScore.create({
      data: {
        clientId,
        tenantId,
        score:          result.score,
        risk:           result.riskLevel === 'LOW'    ? 'LOW'
                      : result.riskLevel === 'MEDIUM' ? 'MEDIUM'
                      : result.riskLevel === 'HIGH'   ? 'HIGH' : 'VERY_HIGH',
        recommendation: result.recommendation === 'PROCEED' ? 'APPROVE'
                      : result.recommendation === 'ENHANCED_DUE_DILIGENCE' ? 'REVIEW'
                      : 'REJECT',
        factors:        pldFactors,
        calculatedAt:   new Date(),
        validUntil:     new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 año
      },
    });

    return { ...result, persistedId: saved.id };
  }
}

export default PldRiskScoringService;
