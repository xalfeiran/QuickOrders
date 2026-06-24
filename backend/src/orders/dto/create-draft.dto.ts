import { IsOptional, IsString } from 'class-validator';

// Body for POST /api/orders/draft. The business is optional — when omitted the
// draft is created for the default business (legacy single-tenant entry).
export class CreateDraftDto {
  @IsOptional()
  @IsString()
  businessSlug?: string;
}
