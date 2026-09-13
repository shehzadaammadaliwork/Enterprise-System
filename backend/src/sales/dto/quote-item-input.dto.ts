import { IsNumber, IsUUID, Max, Min } from 'class-validator';

/// One line of a quote, as submitted by the client. The catalog no longer
/// carries any pricing (Product has no unitPrice/taxRatePercent) — every
/// deal is priced custom, so the rep enters both unitPrice and
/// taxRatePercent by hand for every line item, every time. QuotesService
/// only uses `productId` to look up the product's name (for the line's
/// description) and to validate it exists.
export class QuoteItemInputDto {
  @IsUUID('4')
  productId!: string;

  @IsNumber()
  @Min(0.01)
  quantity!: number;

  @IsNumber()
  @Min(0)
  unitPrice!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  taxRatePercent!: number;
}
