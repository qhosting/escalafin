
import { PrismaClient } from '@prisma/client';

interface ScoringFactors {
  income: number;
  expenses: number;
  existingDebts: number;
  creditHistory: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'NONE';
  employmentStatus: 'EMPLOYED' | 'SELF_EMPLOYED' | 'UNEMPLOYED' | 'RETIRED';
  employmentYears: number;
  age: number;
  requestedAmount: number;
  requestedTerm: number; // en meses
}

interface ScoringResult {
  score: number;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  recommendation: 'APPROVE' | 'REVIEW' | 'REJECT';
  maxAmount?: number;
  recommendedRate?: number;
  factors: {
    income: number;
    debt_to_income: number;
    credit_history: number;
    employment: number;
    age: number;
    amount_requested: number;
  };
}

const SCORING_WEIGHTS = {
  income: 0.25,
  debt_to_income: 0.20,
  credit_history: 0.20,
  employment: 0.15,
  age: 0.10,
  amount_requested: 0.10,
};

export class CreditScoringSystem {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  private calculateIncomeScore(income: number): number {
    if (income >= 50000) return 100;
    if (income >= 30000) return 80;
    if (income >= 20000) return 60;
    if (income >= 10000) return 40;
    return 20;
  }

  private calculateDebtToIncomeScore(income: number, expenses: number, existingDebts: number): number {
    const totalDebt = expenses + existingDebts;
    const debtToIncomeRatio = totalDebt / income;
    
    if (debtToIncomeRatio <= 0.3) return 100;
    if (debtToIncomeRatio <= 0.4) return 80;
    if (debtToIncomeRatio <= 0.5) return 60;
    if (debtToIncomeRatio <= 0.6) return 40;
    return 20;
  }

  private calculateCreditHistoryScore(creditHistory: string): number {
    switch (creditHistory) {
      case 'EXCELLENT': return 100;
      case 'GOOD': return 80;
      case 'FAIR': return 60;
      case 'POOR': return 30;
      case 'NONE': return 40;
      default: return 40;
    }
  }

  private calculateEmploymentScore(employmentStatus: string, employmentYears: number): number {
    let baseScore = 0;
    
    switch (employmentStatus) {
      case 'EMPLOYED': baseScore = 90; break;
      case 'SELF_EMPLOYED': baseScore = 70; break;
      case 'RETIRED': baseScore = 60; break;
      case 'UNEMPLOYED': baseScore = 20; break;
      default: baseScore = 40;
    }

    // Bonus por años de empleo
    if (employmentYears >= 5) baseScore += 10;
    else if (employmentYears >= 2) baseScore += 5;

    return Math.min(baseScore, 100);
  }

  private calculateAgeScore(age: number): number {
    if (age >= 25 && age <= 55) return 100;
    if (age >= 18 && age <= 65) return 80;
    return 60;
  }

  private calculateAmountRequestedScore(requestedAmount: number, income: number): number {
    const amountToIncomeRatio = requestedAmount / (income * 12); // Ratio con ingreso anual
    
    if (amountToIncomeRatio <= 0.5) return 100;
    if (amountToIncomeRatio <= 1.0) return 80;
    if (amountToIncomeRatio <= 2.0) return 60;
    if (amountToIncomeRatio <= 3.0) return 40;
    return 20;
  }

  public calculateScore(factors: ScoringFactors): ScoringResult {
    const scores = {
      income: this.calculateIncomeScore(factors.income),
      debt_to_income: this.calculateDebtToIncomeScore(factors.income, factors.expenses, factors.existingDebts),
      credit_history: this.calculateCreditHistoryScore(factors.creditHistory),
      employment: this.calculateEmploymentScore(factors.employmentStatus, factors.employmentYears),
      age: this.calculateAgeScore(factors.age),
      amount_requested: this.calculateAmountRequestedScore(factors.requestedAmount, factors.income),
    };

    // Calcular score ponderado
    const finalScore = Math.round(
      scores.income * SCORING_WEIGHTS.income +
      scores.debt_to_income * SCORING_WEIGHTS.debt_to_income +
      scores.credit_history * SCORING_WEIGHTS.credit_history +
      scores.employment * SCORING_WEIGHTS.employment +
      scores.age * SCORING_WEIGHTS.age +
      scores.amount_requested * SCORING_WEIGHTS.amount_requested
    );

    // Determinar nivel de riesgo
    let risk: ScoringResult['risk'];
    let recommendation: ScoringResult['recommendation'];
    let maxAmount: number | undefined;
    let recommendedRate: number | undefined;

    if (finalScore >= 80) {
      risk = 'LOW';
      recommendation = 'APPROVE';
      maxAmount = factors.requestedAmount;
      recommendedRate = 0.12; // 12% anual
    } else if (finalScore >= 65) {
      risk = 'MEDIUM';
      recommendation = 'APPROVE';
      maxAmount = Math.min(factors.requestedAmount, factors.income * 0.8);
      recommendedRate = 0.16; // 16% anual
    } else if (finalScore >= 50) {
      risk = 'HIGH';
      recommendation = 'REVIEW';
      maxAmount = Math.min(factors.requestedAmount, factors.income * 0.5);
      recommendedRate = 0.20; // 20% anual
    } else {
      risk = 'VERY_HIGH';
      recommendation = 'REJECT';
      recommendedRate = 0.25; // 25% anual
    }

    return {
      score: finalScore,
      risk,
      recommendation,
      maxAmount,
      recommendedRate,
      factors: scores,
    };
  }

  public async saveScoringResult(loanId: string, result: ScoringResult): Promise<void> {
    try {
      await this.prisma.creditScore.create({
        data: {
          loanId,
          score: result.score,
          risk: result.risk,
          recommendation: result.recommendation,
          maxAmount: result.maxAmount,
          recommendedRate: result.recommendedRate,
          factors: JSON.stringify(result.factors),
          createdAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Error saving scoring result:', error);
      throw error;
    }
  }
}

export { type ScoringFactors, type ScoringResult };
