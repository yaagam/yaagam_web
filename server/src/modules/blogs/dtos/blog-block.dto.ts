import {
  Allow,
  IsEnum,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { BlogBlockType } from '@prisma/client';

export class BlogBlockDto {
  @IsOptional()
  @IsString()
  id?: string;

  @IsInt()
  @Min(1)
  order: number;

  @IsEnum(BlogBlockType)
  type: BlogBlockType;

  @IsObject()
  @Allow()
  data: Record<string, unknown>;
}
