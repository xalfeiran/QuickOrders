import { IsIn } from 'class-validator';
import { OrderStatus } from '../../orders/order.entity';

export class UpdateOrderStatusDto {
  @IsIn(['received', 'preparing', 'ready', 'completed'])
  status!: OrderStatus;
}
