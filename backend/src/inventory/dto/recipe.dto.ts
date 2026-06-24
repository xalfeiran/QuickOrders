import { IsArray, IsOptional } from 'class-validator';

// Loose shape; contents are validated in the service against the business's
// ingredients and the item's options.
//   base: [{ ingredientId, quantity }]
//   options: [{ groupId, optionId, components: [{ ingredientId, quantity }] }]
export class RecipeDto {
  @IsOptional()
  @IsArray()
  base?: unknown[];

  @IsOptional()
  @IsArray()
  options?: unknown[];
}
