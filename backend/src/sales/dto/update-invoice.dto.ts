import { IsDateString, IsOptional } from 'class-validator';

/// PAID/PARTIALLY_PAID/UNPAID are derived from recorded Payments, not
/// directly settable — see InvoicesService.recomputeStatus. VOID is set
/// only via POST /sales/invoices/:id/void.
export class UpdateInvoiceDto {
  @IsOptional()
  @IsDateString()
  dueDate?: string;
}
