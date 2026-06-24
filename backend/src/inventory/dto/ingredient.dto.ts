import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class IngredientDto {
  @IsString()
  @MinLength(2)
  name!: string;

  @IsIn(['gr', 'ml', 'pza'])
  unit!: string;

  @IsNumber()
  @Min(0)
  stockQty!: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;
}
