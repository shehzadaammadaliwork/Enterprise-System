-- DropIndex
DROP INDEX "sales_products_sku_key";

-- AlterTable
ALTER TABLE "sales_products" DROP COLUMN "sku",
DROP COLUMN "taxRatePercent",
DROP COLUMN "unitPrice";
