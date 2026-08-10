import { plainToInstance } from 'class-transformer';
import { PoojaTranslationDto } from './pooja-translation.dto';

export { parseBooleanValue } from '../../../common/utils/transform.util';

export const parseTranslations = (value: unknown): unknown => {
  const parsedValue = parseJsonValue(value);

  return Array.isArray(parsedValue)
    ? plainToInstance(PoojaTranslationDto, parsedValue)
    : parsedValue;
};

export const parseStringArray = (value: unknown): unknown => {
  const parsedValue = parseJsonValue(value);

  if (Array.isArray(parsedValue)) {
    return parsedValue;
  }

  return typeof parsedValue === 'string' ? [parsedValue] : parsedValue;
};

export const parseNumberArray = (value: unknown): unknown => {
  const parsedValue = parseJsonValue(value);

  return Array.isArray(parsedValue) ? parsedValue : value;
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
