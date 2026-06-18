import { Language } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class TempleTranslationDto {
  @IsEnum(Language)
  language: Language;

  @IsString()
  name: string;

  @IsString()
  district: string;

  @IsString()
  place: string;
}
