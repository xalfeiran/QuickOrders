import { IsString, Matches, MinLength } from 'class-validator';

// Body for POST /api/verify/confirm.
export class ConfirmCodeDto {
  @IsString()
  @MinLength(7)
  phone!: string;

  // Exactly six digits.
  @IsString()
  @Matches(/^\d{6}$/, { message: 'code must be 6 digits' })
  code!: string;
}
