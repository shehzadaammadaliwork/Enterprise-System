-- CreateEnum
CREATE TYPE "AssetCategory" AS ENUM ('LAPTOP', 'MONITOR', 'PHONE', 'OTHER_EQUIPMENT');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('ASSIGNED', 'AVAILABLE', 'UNDER_REPAIR', 'RETIRED');

-- CreateEnum
CREATE TYPE "PurchaseRequestCategory" AS ENUM ('EQUIPMENT', 'SOFTWARE_SUBSCRIPTION', 'OTHER');

-- CreateEnum
CREATE TYPE "PurchaseRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PURCHASED');

-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "AssetCategory" NOT NULL,
    "serialNumber" TEXT,
    "purchaseDate" TIMESTAMP(3),
    "purchaseCost" DECIMAL(12,2),
    "assignedEmployeeId" TEXT,
    "status" "AssetStatus" NOT NULL DEFAULT 'AVAILABLE',
    "retirementReason" TEXT,
    "notes" TEXT,
    "purchaseRequestId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "purchase_requests" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "category" "PurchaseRequestCategory" NOT NULL,
    "estimatedCost" DECIMAL(12,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "PurchaseRequestStatus" NOT NULL DEFAULT 'PENDING',
    "requestedByUserId" TEXT NOT NULL,
    "decidedByUserId" TEXT,
    "decidedAt" TIMESTAMP(3),
    "actualAmount" DECIMAL(12,2),
    "purchasedByUserId" TEXT,
    "purchasedAt" TIMESTAMP(3),
    "linkedExpenseId" TEXT,
    "linkedAssetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "assets_purchaseRequestId_key" ON "assets"("purchaseRequestId");

-- CreateIndex
CREATE INDEX "assets_status_idx" ON "assets"("status");

-- CreateIndex
CREATE INDEX "assets_category_idx" ON "assets"("category");

-- CreateIndex
CREATE INDEX "assets_assignedEmployeeId_idx" ON "assets"("assignedEmployeeId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requests_number_key" ON "purchase_requests"("number");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requests_linkedExpenseId_key" ON "purchase_requests"("linkedExpenseId");

-- CreateIndex
CREATE UNIQUE INDEX "purchase_requests_linkedAssetId_key" ON "purchase_requests"("linkedAssetId");

-- CreateIndex
CREATE INDEX "purchase_requests_status_idx" ON "purchase_requests"("status");

-- CreateIndex
CREATE INDEX "purchase_requests_requestedByUserId_idx" ON "purchase_requests"("requestedByUserId");
