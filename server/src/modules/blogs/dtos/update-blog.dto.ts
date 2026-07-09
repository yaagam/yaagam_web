import { Type } from 'class-transformer';
import { BlogStatus } from '@prisma/client';
import {
  IsArray,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { BlogBlockDto } from './blog-block.dto';
import { BlogRelationsDto } from './blog-relations.dto';
import { BlogTranslationDto } from './blog-translation.dto';

export class UpdateBlogDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  excerpt?: string;

  @IsOptional()
  @IsString()
  author?: string;

  @IsOptional()
  @IsEnum(BlogStatus)
  status?: BlogStatus;

  @IsOptional()
  @IsString()
  metaTitle?: string;

  @IsOptional()
  @IsString()
  metaDescription?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date | null;

  @IsOptional()
  @ValidateNested()
  @Type(() => BlogRelationsDto)
  relations?: BlogRelationsDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogBlockDto)
  blocks?: BlogBlockDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogTranslationDto)
  translations?: BlogTranslationDto[];
}
