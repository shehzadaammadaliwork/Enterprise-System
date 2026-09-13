import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { QuoteStatus } from '@prisma/client';
import { QuoteItemInputDto } from './quote-item-input.dto';

export class UpdateQuoteDto {
  /// Optional link to a Deal — omit to leave unchanged, or send `null` to
  /// unlink. See Quote.dealId's schema comment.
  @IsOptional()
  @IsUUID('4')
  dealId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteItemInputDto)
  items?: QuoteItemInputDto[];

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;

  /// CONVERTED is rejected here — that transition only happens via
  /// POST /sales/quotes/:id/convert, which also creates the Order.
  @IsOptional()
  @IsEnum(QuoteStatus)
  status?: QuoteStatus;
}
