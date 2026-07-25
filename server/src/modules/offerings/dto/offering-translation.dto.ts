import { Language } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class OfferingTranslationDto {
  @IsEnum(Language)
  language: Language;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  description: string;
}
