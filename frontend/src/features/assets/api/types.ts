export type AssetCategory = 'LAPTOP' | 'MONITOR' | 'PHONE' | 'OTHER_EQUIPMENT';
export type AssetStatus = 'ASSIGNED' | 'AVAILABLE' | 'UNDER_REPAIR' | 'RETIRED';

export interface Asset {
  id: string;
  name: string;
  category: AssetCategory;
  serialNumber: string | null;
  purchaseDate: string | null;
  purchaseCost: number | null;
  assignedEmployeeId: string | null;
  status: AssetStatus;
  retirementReason: string | null;
  notes: string | null;
  purchaseRequestId: string | null;
  createdAt: string;
  updatedAt: string;
}
