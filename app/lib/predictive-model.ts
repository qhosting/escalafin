
import { PrismaClient, Client, Loan, Payment, CreditScore } from '@prisma/client';

const prisma = new PrismaClient();

interface ScoringInput {
  client: Client & {
    loans: (Loan & {
      payments: Payment[];
    })[];
  };
  requestedAmount?: number;
}

interface ScoringResult {
  score: number; // 300 - 850
  probabilityOfDefault: number; // 0.0 - 1.0
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
  factors: string[];
  maxRecommendedAmount: number;
}

export class PredictiveScoringModel {
  /**
   * Logistic Regression -like weights (Simulated/Heuristic)
   * These would ideally be trained on historical data.
   */
  private readonly weights = {
    paymentHistory: -2.5, // Negative impact on default prob (Good history = lower prob)
    debtToIncome: 3.0,    // Positive impact on default prob (High DTI = higher prob)
    activeLoansCount: 0.5,
    loanDuration: 0.2,
    bias: -1.0
  };

  async calculateScore(clientId: string, requestedAmount: number = 0): Promise<ScoringResult> {
    // 1. Fetch Data
    const client = await prisma.client.findUnique({
      where: { id: clientId },
      include: {
        loans: {
          include: {
            payments: true
          }
        }
      }
    });

    if (!client) throw new Error('Client not found');

    // 2. Extract Features
    const features = this.extractFeatures({ client, requestedAmount });

    // 3. Calculate Probability of Default (PD)
    // Sigmoid function: P(y=1) = 1 / (1 + e^-z)
    // z = w1*x1 + w2*x2 + ... + b
    const z =
      (features.latePaymentRatio * 5.0) + // Penalize late payments heavily
      (features.debtToIncomeRatio * this.weights.debtToIncome) +
      (features.activeLoansCount * this.weights.activeLoansCount) +
      this.weights.bias;

    const pd = 1 / (1 + Math.exp(-z));

    // 4. Map PD to FICO-like Score (300-850)
    // PD 0.0 -> 850 (Low risk)
    // PD 1.0 -> 300 (High risk)
    // Linear mapping approximation: Score = 850 - (PD * 550)
    const score = Math.round(850 - (pd * 550));

    // 5. Determine Risk Level
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    if (score >= 750) riskLevel = 'LOW';
    else if (score >= 650) riskLevel = 'MEDIUM';
    else if (score >= 550) riskLevel = 'HIGH';
    else riskLevel = 'VERY_HIGH';

    // 6. Generate Recommendations & Factors
    const factors = [];
    if (features.latePaymentRatio > 0.1) factors.push('Historial de pagos irregulares');
    if (features.debtToIncomeRatio > 0.4) factors.push('Alta relación deuda-ingreso');
    if (features.activeLoansCount > 2) factors.push('Múltiples préstamos activos');
    if (client.yearsEmployed && client.yearsEmployed < 1) factors.push('Baja antigüedad laboral');

    // Max amount logic: Limit based on available income (e.g., 30% of income for payments)
    const monthlyIncome = Number(client.monthlyIncome) || 0;
    const disposableIncome = monthlyIncome * 0.3; // Allow 30% for debt
    // Simple PV calculation for max loan (approximate)
    const maxRecommendedAmount = disposableIncome * 12; // 1 year term cap roughly

    return {
      score,
      probabilityOfDefault: pd,
      riskLevel,
      factors,
      maxRecommendedAmount
    };
  }

  private extractFeatures(input: ScoringInput) {
    const { client, requestedAmount } = input;
    const monthlyIncome = Number(client.monthlyIncome) || 1000; // Fallback to 1000 if 0 to avoid division by zero

    // Payment History
    let totalPayments = 0;
    let latePayments = 0;
    let activeLoansCount = 0;
    let currentMonthlyDebt = 0;

    input.client.loans.forEach(loan => {
      if (loan.status === 'ACTIVE') {
        activeLoansCount++;
        currentMonthlyDebt += Number(loan.monthlyPayment);
      } else if (loan.status === 'DEFAULTED') {
        latePayments += 5; // Heavy penalty for defaults
      }

      loan.payments.forEach(payment => {
        totalPayments++;
        // Check if payment was late (assuming we had a dueDate, but schema might not track it easily per payment row without schedule)
        // For this heuristic, we'll assume manual flagging or check status if available.
        // Let's use simple logic: if loan is defaulted, all payments count bad.
      });
    });

    const latePaymentRatio = totalPayments > 0 ? latePayments / totalPayments : 0; // 0 to 1

    // Debt to Income (DTI)
    // New loan impact
    const estimatedNewMonthlyPayment = requestedAmount ? requestedAmount * 0.15 : 0; // Approx 15% monthly
    const totalMonthlyDebt = currentMonthlyDebt + estimatedNewMonthlyPayment;
    const debtToIncomeRatio = totalMonthlyDebt / monthlyIncome;

    return {
      latePaymentRatio,
      debtToIncomeRatio,
      activeLoansCount
    };
  }
}
