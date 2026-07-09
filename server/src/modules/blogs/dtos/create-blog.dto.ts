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

export class CreateBlogDto {
  @IsString()
  title: string;

  @IsString()
  excerpt: string;

  @IsString()
  author: string;

  @IsEnum(BlogStatus)
  status: BlogStatus;

  @IsString()
  metaTitle: string;

  @IsString()
  metaDescription: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  publishedAt?: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => BlogRelationsDto)
  relations?: BlogRelationsDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogBlockDto)
  blocks: BlogBlockDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BlogTranslationDto)
  translations?: BlogTranslationDto[];
}
