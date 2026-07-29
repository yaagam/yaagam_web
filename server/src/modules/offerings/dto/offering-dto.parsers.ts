import { plainToInstance } from 'class-transformer';
import { OfferingTranslationDto } from './offering-translation.dto';

export const parseOfferingTranslations = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }
  try {
    return plainToInstance(
      OfferingTranslationDto,
      JSON.parse(value) as unknown[],
    );
  } catch {
    return value;
  }
};

export const parseBooleanValue = (value: unknown): unknown => {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
};
