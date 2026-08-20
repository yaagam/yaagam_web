import { Type } from 'class-transformer';
import {
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
} from 'class-validator';

export class RecoverSettlementDto {
  @IsString()
  @Matches(/^setl_[A-Za-z0-9]+$/)
  providerSettlementId!: string;
}

export class BackfillSettlementsDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  days = 3;
}
