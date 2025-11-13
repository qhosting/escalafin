
-- CreateEnum
CREATE TYPE "LoanCalculationType" AS ENUM ('INTERES', 'TARIFA_FIJA');

-- AlterTable
ALTER TABLE "loans" ADD COLUMN "loanCalculationType" "LoanCalculationType" NOT NULL DEFAULT 'INTERES';
