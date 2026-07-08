import { Language } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class BlogTranslationDto {
  @IsEnum(Language)
  language: Language;

  @IsString()
  title: string;

  @IsString()
  excerpt: string;

  @IsString()
  metaTitle: string;

  @IsString()
  metaDescription: string;
}
