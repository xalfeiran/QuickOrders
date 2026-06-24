import { IsString, MinLength } from 'class-validator';

// Body for POST /api/auth/login.
export class LoginDto {
  @IsString()
  @MinLength(3)
  email!: string;

  @IsString()
  @MinLength(1)
  password!: string;
}
