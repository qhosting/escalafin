
-- AlterEnum
ALTER TYPE "LoanCalculationType" ADD VALUE 'INTERES_SEMANAL';

-- AlterTable  
ALTER TABLE "loans" ADD COLUMN "weeklyInterestAmount" DECIMAL(12,2);

-- CreateTable
CREATE TABLE "weekly_interest_rates" (
    "id" TEXT NOT NULL,
    "minAmount" DECIMAL(12,2) NOT NULL,
    "maxAmount" DECIMAL(12,2) NOT NULL,
    "weeklyInterestRate" DECIMAL(5,2) NOT NULL,
    "weeklyInterestAmount" DECIMAL(12,2) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "weekly_interest_rates_pkey" PRIMARY KEY ("id")
);

-- Seed default weekly interest rates based on user requirements
INSERT INTO "weekly_interest_rates" ("id", "minAmount", "maxAmount", "weeklyInterestRate", "weeklyInterestAmount", "isActive") VALUES
('wir_3000', 3000, 3000, 5.67, 170, true),
('wir_4000', 4000, 4000, 5.00, 200, true),
('wir_5000', 5000, 5000, 4.60, 230, true),
('wir_6000', 6000, 6000, 4.34, 260, true),
('wir_7000', 7000, 7000, 4.15, 291, true),
('wir_8000', 8000, 8000, 4.00, 320, true),
('wir_9000', 9000, 9000, 4.00, 360, true),
('wir_10000', 10000, 10000, 4.00, 400, true);
