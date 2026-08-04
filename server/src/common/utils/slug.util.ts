import { BadRequestException } from '@nestjs/common';

export function createSlug(value: string): string {
  const slug = value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!slug) {
    throw new BadRequestException(
      'An English name is required to generate a public slug',
    );
  }

  return slug;
}
