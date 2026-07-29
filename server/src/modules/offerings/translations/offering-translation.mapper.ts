import type { OfferingTranslationDto } from '../dto/offering-translation.dto';

export const toOfferingTranslations = (
  translations: OfferingTranslationDto[],
): OfferingTranslationDto[] =>
  translations.map(({ language, name, description }) => ({
    language,
    name: name.trim(),
    description: description.trim(),
  }));
