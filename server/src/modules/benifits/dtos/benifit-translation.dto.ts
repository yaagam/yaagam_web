import { Language } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class BenifitTranslationDto {
  @IsEnum(Language)
  language: Language;

  @IsString()
  name: string;

  @IsString()
  description: string;
}
