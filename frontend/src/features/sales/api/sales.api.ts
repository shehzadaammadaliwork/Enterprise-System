import { apiClient } from '../../../shared/api/client';
import type { PaginationMeta } from '../../../shared/api/pagination';
import type {
  Invoice,
  InvoiceDetail,
  InvoiceStatus,
  Order,
  OrderStatus,
  Payment,
  PaymentMethod,
  Product,
  ProductType,
  Quote,
  QuoteStatus,
} from './types';

interface Envelope<T> {
  success: true;
  data: T;
}

interface PaginatedEnvelope<T> {
  success: true;
  data: T[];
  meta: PaginationMeta;
}

// -- Products (catalog) ------------------------------------------------------

export async function fetchProducts(type?: ProductType, search?: string, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<Product>>('/sales/products', { params: { type, search, page, limit } });
  return res.data;
}

export async function fetchProduct(id: string) {
  const res = await apiClient.get<Envelope<Product>>(`/sales/products/${id}`);
  return res.data.data;
}

export interface ProductInput {
  name: string;
  description?: string;
  type?: ProductType;
}

export async function createProduct(input: ProductInput) {
  const res = await apiClient.post<Envelope<Product>>('/sales/products', input);
  return res.data.data;
}

export async function updateProduct(id: string, input: Partial<ProductInput> & { isActive?: boolean }) {
  const res = await apiClient.patch<Envelope<Product>>(`/sales/products/${id}`, input);
  return res.data.data;
}

export async function deleteProduct(id: string) {
  await apiClient.delete(`/sales/products/${id}`);
}

// -- Quotes -------------------------------------------------------------------

export async function fetchQuotes(customerId?: string, status?: QuoteStatus, dealId?: string, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<Quote>>('/sales/quotes', {
    params: { customerId, status, dealId, page, limit },
  });
  return res.data;
}

export async function fetchQuote(id: string) {
  const res = await apiClient.get<Envelope<Quote>>(`/sales/quotes/${id}`);
  return res.data.data;
}

export interface QuoteItemInput {
  productId: string;
  quantity: number;
  /// The catalog carries no pricing at all — every deal is priced custom,
  /// so the rep enters both fields manually for every line item, every
  /// time. No catalog default to fall back to.
  unitPrice: number;
  taxRatePercent: number;
}

export interface QuoteInput {
  customerId: string;
  dealId?: string;
  items: QuoteItemInput[];
  validUntil?: string;
  notes?: string;
}

export async function createQuote(input: QuoteInput) {
  const res = await apiClient.post<Envelope<Quote>>('/sales/quotes', input);
  return res.data.data;
}

export async function updateQuote(
  id: string,
  input: Partial<Omit<QuoteInput, 'customerId' | 'dealId'>> & { status?: QuoteStatus; dealId?: string | null },
) {
  const res = await apiClient.patch<Envelope<Quote>>(`/sales/quotes/${id}`, input);
  return res.data.data;
}

export async function deleteQuote(id: string) {
  await apiClient.delete(`/sales/quotes/${id}`);
}

export async function convertQuote(id: string) {
  const res = await apiClient.post<Envelope<{ quote: Quote; order: Order }>>(`/sales/quotes/${id}/convert`);
  return res.data.data;
}

// -- Orders ---------------------------------------------------------------

export async function fetchOrders(customerId?: string, status?: OrderStatus, dealId?: string, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<Order>>('/sales/orders', {
    params: { customerId, status, dealId, page, limit },
  });
  return res.data;
}

export async function fetchOrder(id: string) {
  const res = await apiClient.get<Envelope<Order>>(`/sales/orders/${id}`);
  return res.data.data;
}

export async function updateOrder(id: string, status: OrderStatus) {
  const res = await apiClient.patch<Envelope<Order>>(`/sales/orders/${id}`, { status });
  return res.data.data;
}

export async function generateInvoice(orderId: string) {
  const res = await apiClient.post<Envelope<InvoiceDetail>>(`/sales/orders/${orderId}/invoice`);
  return res.data.data;
}

// -- Invoices ---------------------------------------------------------------

export async function fetchInvoices(customerId?: string, status?: InvoiceStatus, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<Invoice>>('/sales/invoices', { params: { customerId, status, page, limit } });
  return res.data;
}

export async function fetchInvoice(id: string) {
  const res = await apiClient.get<Envelope<InvoiceDetail>>(`/sales/invoices/${id}`);
  return res.data.data;
}

export async function updateInvoiceDueDate(id: string, dueDate: string) {
  const res = await apiClient.patch<Envelope<InvoiceDetail>>(`/sales/invoices/${id}`, { dueDate });
  return res.data.data;
}

export async function voidInvoice(id: string) {
  const res = await apiClient.post<Envelope<InvoiceDetail>>(`/sales/invoices/${id}/void`);
  return res.data.data;
}

// -- Payments -----------------------------------------------------------------

export async function fetchPayments(invoiceId: string, page = 1, limit = 20) {
  const res = await apiClient.get<PaginatedEnvelope<Payment>>('/sales/payments', { params: { invoiceId, page, limit } });
  return res.data;
}

export interface PaymentInput {
  invoiceId: string;
  amount: number;
  method?: PaymentMethod;
  reference?: string;
  paidAt?: string;
}

export async function createPayment(input: PaymentInput) {
  const res = await apiClient.post<Envelope<Payment>>('/sales/payments', input);
  return res.data.data;
}
