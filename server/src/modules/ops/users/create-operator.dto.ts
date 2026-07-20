import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { OperatorRole } from '@prisma/client';

export class CreateOperatorDto {
  @IsString()
  username: string;

  @IsString()
  @MinLength(12)
  password: string;

  @IsEnum(OperatorRole)
  role: OperatorRole;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
