-- CreateEnum
CREATE TYPE "PayrollRunScope" AS ENUM ('ALL_ACTIVE', 'SELECTED');

-- AlterTable
ALTER TABLE "payroll_runs" ADD COLUMN     "scope" "PayrollRunScope" NOT NULL DEFAULT 'ALL_ACTIVE',
ADD COLUMN     "selectedEmployeeIds" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "payslip_items" ADD COLUMN     "adjustmentDeductionEncrypted" TEXT,
ADD COLUMN     "bonusEncrypted" TEXT;

-- CreateTable
CREATE TABLE "payroll_adjustments" (
    "id" TEXT NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "employeeId" TEXT NOT NULL,
    "bonusEncrypted" TEXT NOT NULL,
    "deductionEncrypted" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payroll_adjustments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "payroll_adjustments_employeeId_idx" ON "payroll_adjustments"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "payroll_adjustments_month_year_employeeId_key" ON "payroll_adjustments"("month", "year", "employeeId");

-- AddForeignKey
ALTER TABLE "payroll_adjustments" ADD CONSTRAINT "payroll_adjustments_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;
