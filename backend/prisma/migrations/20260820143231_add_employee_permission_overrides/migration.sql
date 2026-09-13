-- CreateEnum
CREATE TYPE "PermissionOverrideState" AS ENUM ('GRANTED', 'DENIED');

-- CreateTable
CREATE TABLE "employee_permission_overrides" (
    "id" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "permissionId" TEXT NOT NULL,
    "state" "PermissionOverrideState" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "employee_permission_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "employee_permission_overrides_employeeId_idx" ON "employee_permission_overrides"("employeeId");

-- CreateIndex
CREATE UNIQUE INDEX "employee_permission_overrides_employeeId_permissionId_key" ON "employee_permission_overrides"("employeeId", "permissionId");

-- AddForeignKey
ALTER TABLE "employee_permission_overrides" ADD CONSTRAINT "employee_permission_overrides_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "employees"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "employee_permission_overrides" ADD CONSTRAINT "employee_permission_overrides_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "permissions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
