import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as api from './sales.api';
import type { InvoiceStatus, OrderStatus, ProductType, QuoteStatus } from './types';

const KEYS = {
  products: ['sales', 'products'] as const,
  product: (id: string) => ['sales', 'products', id] as const,
  quotes: ['sales', 'quotes'] as const,
  quote: (id: string) => ['sales', 'quotes', id] as const,
  orders: ['sales', 'orders'] as const,
  order: (id: string) => ['sales', 'orders', id] as const,
  invoices: ['sales', 'invoices'] as const,
  invoice: (id: string) => ['sales', 'invoices', id] as const,
  payments: (invoiceId: string) => ['sales', 'payments', invoiceId] as const,
};

// -- Products -----------------------------------------------------------------

export function useProducts(type?: ProductType, search?: string) {
  return useQuery({ queryKey: [...KEYS.products, type, search], queryFn: () => api.fetchProducts(type, search) });
}

export function useProduct(id: string | undefined) {
  return useQuery({ queryKey: KEYS.product(id ?? ''), queryFn: () => api.fetchProduct(id!), enabled: !!id });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEYS.products });
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({ mutationFn: api.createProduct, onSuccess: invalidate });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<api.ProductInput> & { isActive?: boolean } }) =>
      api.updateProduct(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({ mutationFn: api.deleteProduct, onSuccess: invalidate });
}

// -- Quotes -------------------------------------------------------------------

export function useQuotes(customerId?: string, status?: QuoteStatus, dealId?: string) {
  return useQuery({
    queryKey: [...KEYS.quotes, customerId, status, dealId],
    queryFn: () => api.fetchQuotes(customerId, status, dealId),
  });
}

export function useQuote(id: string | undefined) {
  return useQuery({ queryKey: KEYS.quote(id ?? ''), queryFn: () => api.fetchQuote(id!), enabled: !!id });
}

function useInvalidateQuotes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: KEYS.quotes });
}

export function useCreateQuote() {
  const invalidate = useInvalidateQuotes();
  return useMutation({ mutationFn: api.createQuote, onSuccess: invalidate });
}

export function useUpdateQuote() {
  const invalidate = useInvalidateQuotes();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Parameters<typeof api.updateQuote>[1] }) => api.updateQuote(id, input),
    onSuccess: invalidate,
  });
}

export function useDeleteQuote() {
  const invalidate = useInvalidateQuotes();
  return useMutation({ mutationFn: api.deleteQuote, onSuccess: invalidate });
}

export function useConvertQuote() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.convertQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.quotes });
      queryClient.invalidateQueries({ queryKey: KEYS.orders });
    },
  });
}

// -- Orders ---------------------------------------------------------------

export function useOrders(customerId?: string, status?: OrderStatus, dealId?: string) {
  return useQuery({
    queryKey: [...KEYS.orders, customerId, status, dealId],
    queryFn: () => api.fetchOrders(customerId, status, dealId),
  });
}

export function useOrder(id: string | undefined) {
  return useQuery({ queryKey: KEYS.order(id ?? ''), queryFn: () => api.fetchOrder(id!), enabled: !!id });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: OrderStatus }) => api.updateOrder(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEYS.orders }),
  });
}

export function useGenerateInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.generateInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.orders });
      queryClient.invalidateQueries({ queryKey: KEYS.invoices });
    },
  });
}

// -- Invoices ---------------------------------------------------------------

export function useInvoices(customerId?: string, status?: InvoiceStatus) {
  return useQuery({ queryKey: [...KEYS.invoices, customerId, status], queryFn: () => api.fetchInvoices(customerId, status) });
}

export function useInvoice(id: string | undefined) {
  return useQuery({ queryKey: KEYS.invoice(id ?? ''), queryFn: () => api.fetchInvoice(id!), enabled: !!id });
}

export function useUpdateInvoiceDueDate() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dueDate }: { id: string; dueDate: string }) => api.updateInvoiceDueDate(id, dueDate),
    onSuccess: (_data, variables) => queryClient.invalidateQueries({ queryKey: KEYS.invoice(variables.id) }),
  });
}

export function useVoidInvoice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.voidInvoice,
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: KEYS.invoice(id) });
      queryClient.invalidateQueries({ queryKey: KEYS.invoices });
    },
  });
}

// -- Payments -----------------------------------------------------------------

export function usePayments(invoiceId: string) {
  return useQuery({ queryKey: KEYS.payments(invoiceId), queryFn: () => api.fetchPayments(invoiceId), enabled: !!invoiceId });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createPayment,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.payments(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: KEYS.invoice(variables.invoiceId) });
      queryClient.invalidateQueries({ queryKey: KEYS.invoices });
    },
  });
}
