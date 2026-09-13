import { IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

/// Orders are created only via POST /sales/quotes/:id/convert — the only
/// thing an update can change afterwards is the fulfillment status.
export class UpdateOrderDto {
  @IsEnum(OrderStatus)
  status!: OrderStatus;
}
