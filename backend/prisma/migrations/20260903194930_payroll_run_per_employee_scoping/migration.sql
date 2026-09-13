-- DropIndex
DROP INDEX "payroll_runs_month_year_key";

-- CreateIndex
CREATE INDEX "payroll_runs_month_year_idx" ON "payroll_runs"("month", "year");
