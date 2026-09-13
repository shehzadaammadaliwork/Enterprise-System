export type ProductType = 'PRODUCT' | 'SERVICE';
export type QuoteStatus = 'DRAFT' | 'SENT' | 'ACCEPTED' | 'REJECTED' | 'EXPIRED' | 'CONVERTED';
export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED';
export type InvoiceStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID' | 'VOID';
export type PaymentMethod = 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'CHEQUE' | 'OTHER';

export interface Product {
  id: string;
  name: string;
  description: string | null;
  type: ProductType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LineItem {
  id: string;
  productId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRatePercent: number;
  lineTotal: number;
  createdAt: string;
}

export interface LineItemSummary {
  subtotal: number;
  taxTotal: number;
  total: number;
}

export interface Quote {
  id: string;
  number: number;
  customerId: string;
  dealId: string | null;
  status: QuoteStatus;
  validUntil: string | null;
  notes: string | null;
  createdByUserId: string;
  convertedToOrderId: string | null;
  items: LineItem[];
  summary: LineItemSummary;
  createdAt: string;
  updatedAt: string;
}

export interface Order {
  id: string;
  number: number;
  customerId: string;
  dealId: string | null;
  status: OrderStatus;
  createdByUserId: string;
  items: LineItem[];
  summary: LineItemSummary;
  invoice?: { id: string; number: number; status: InvoiceStatus } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  reference: string | null;
  paidAt: string;
  recordedByUserId: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  number: number;
  orderId: string;
  customerId: string;
  status: InvoiceStatus;
  totalAmount: number;
  amountPaid: number;
  outstandingBalance: number;
  dueDate: string | null;
  issuedAt: string;
  createdByUserId: string;
  payments: Payment[];
  createdAt: string;
  updatedAt: string;
}

export interface InvoiceDetail extends Invoice {
  order: Order;
}
