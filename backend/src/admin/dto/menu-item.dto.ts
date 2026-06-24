import {
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

// Create/update payload for a menu item. optionGroups is validated and
// normalised in the service (see menu-validation.ts).
export class AdminMenuItemDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsString()
  @MinLength(2)
  category!: string;

  @IsInt()
  @Min(0)
  priceCents!: number;

  @IsOptional()
  @IsBoolean()
  available?: boolean;

  @IsOptional()
  @IsInt()
  sortOrder?: number;

  @IsOptional()
  @IsArray()
  optionGroups?: unknown[];
}

export class AvailabilityDto {
  @IsBoolean()
  available!: boolean;
}
