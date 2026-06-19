import { plainToInstance } from 'class-transformer';
import { PoojaTranslationDto } from './pooja-translation.dto';

export const parseTranslations = (
  value: unknown,
): PoojaTranslationDto[] | unknown => {
  const parsedValue = parseJsonValue(value);

  return Array.isArray(parsedValue)
    ? plainToInstance(PoojaTranslationDto, parsedValue)
    : parsedValue;
};

export const parseStringArray = (value: unknown): string[] | unknown => {
  const parsedValue = parseJsonValue(value);

  if (Array.isArray(parsedValue)) {
    return parsedValue;
  }

  return typeof parsedValue === 'string' ? [parsedValue] : parsedValue;
};

export const parseBooleanValue = (value: unknown): boolean | unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
};

const parseJsonValue = (value: unknown): unknown => {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
};
