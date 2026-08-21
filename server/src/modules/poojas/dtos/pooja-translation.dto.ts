import { Language } from '@prisma/client';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';

export class PoojaTranslationDto {
  @IsEnum(Language)
  language: Language;

  @IsString()
  name: string;

  @IsString()
  about: string;

  @IsString()
  poojaFor: string;

  @IsOptional()
  @IsString()
  mantra?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  dos?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  donts?: string[];
}
