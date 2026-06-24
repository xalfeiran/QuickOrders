import { IsString, MinLength } from 'class-validator';

// Body for POST /api/verify/request.
export class RequestCodeDto {
  @IsString()
  @MinLength(7)
  phone!: string;
}
