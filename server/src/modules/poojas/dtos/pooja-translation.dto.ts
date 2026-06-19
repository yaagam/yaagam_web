import { Language } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class PoojaTranslationDto {
  @IsEnum(Language)
  language: Language;

  @IsString()
  name: string;

  @IsString()
  about: string;
}
