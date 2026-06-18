import { IsObject, IsOptional, IsString } from 'class-validator';

export class TranslateJsonDto {
  @IsObject()
  data: Record<string, unknown>;

  @IsOptional()
  @IsString()
  sourceLanguage?: string;
}
