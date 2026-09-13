-- AlterTable
ALTER TABLE "sales_orders" ADD COLUMN     "dealId" TEXT;

-- AlterTable
ALTER TABLE "sales_quotes" ADD COLUMN     "dealId" TEXT;

-- CreateIndex
CREATE INDEX "sales_orders_dealId_idx" ON "sales_orders"("dealId");

-- CreateIndex
CREATE INDEX "sales_quotes_dealId_idx" ON "sales_quotes"("dealId");
