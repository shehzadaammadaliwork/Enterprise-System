import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { QuoteItemInputDto } from './quote-item-input.dto';

export class CreateQuoteDto {
  @IsUUID('4')
  customerId!: string;

  /// Optional link to the Deal this quote was created for — see
  /// Quote.dealId's schema comment.
  @IsOptional()
  @IsUUID('4')
  dealId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => QuoteItemInputDto)
  items!: QuoteItemInputDto[];

  @IsOptional()
  @IsDateString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  notes?: string;
}
