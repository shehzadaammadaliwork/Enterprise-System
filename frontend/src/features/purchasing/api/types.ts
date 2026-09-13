export type PurchaseRequestCategory = 'EQUIPMENT' | 'SOFTWARE_SUBSCRIPTION' | 'OTHER';
export type PurchaseRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PURCHASED';

export interface PurchaseRequest {
  id: string;
  number: number;
  description: string;
  category: PurchaseRequestCategory;
  estimatedCost: number;
  reason: string;
  status: PurchaseRequestStatus;
  requestedByUserId: string;
  decidedByUserId: string | null;
  decidedAt: string | null;
  actualAmount: number | null;
  purchasedByUserId: string | null;
  purchasedAt: string | null;
  linkedExpenseId: string | null;
  linkedAssetId: string | null;
  createdAt: string;
  updatedAt: string;
}
