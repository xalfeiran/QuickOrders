import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

// One chosen option on a line (validated against the menu server-side).
export class SelectedOptionDto {
  @IsString()
  groupId!: string;

  @IsString()
  optionId!: string;
}

// One requested line. Prices are NOT accepted from the client — they're
// computed on the server from the live menu.
export class OrderLineDto {
  @IsString()
  menuItemId!: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SelectedOptionDto)
  selectedOptions?: SelectedOptionDto[];
}

// Delivery address (required only for delivery orders).
export class AddressDto {
  @IsString()
  @MinLength(2)
  street!: string;

  @IsString()
  @MinLength(1)
  exteriorNumber!: string;

  @IsOptional()
  @IsString()
  interiorNumber?: string;

  @IsString()
  @MinLength(2)
  neighborhood!: string;

  @IsString()
  @MinLength(2)
  city!: string;

  @IsString()
  @MinLength(3)
  postalCode!: string;

  @IsOptional()
  @IsString()
  references?: string;
}

// The full order payload submitted at the end of checkout.
export class ConfirmOrderDto {
  @IsString()
  orderToken!: string;

  // The phone must match the verification grant in the request header.
  @IsString()
  @MinLength(7)
  phone!: string;

  @IsString()
  @MinLength(2)
  customerName!: string;

  @IsIn(['pickup', 'delivery'])
  fulfillmentType!: 'pickup' | 'delivery';

  @IsIn(['cash', 'card'])
  paymentMethod!: 'cash' | 'card';

  @IsOptional()
  @ValidateNested()
  @Type(() => AddressDto)
  address?: AddressDto;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => OrderLineDto)
  items!: OrderLineDto[];
}
