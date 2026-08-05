import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Language } from '@prisma/client';
import { CreateBenifitDto } from '../benifits/dtos/create-benifit.dto';
import { BenifitDetailsRequestDto } from '../benifits/dtos/benifit-details.dto';
import { CreatePoojaDto } from '../poojas/dtos/create-pooja.dto';
import { PoojaDetailsRequestDto } from '../poojas/dtos/pooja-details.dto';
import { CreateTempleDto } from '../temples/dtos/create-temple.dto';
import { TempleDetailsRequestDto } from '../temples/dtos/temple-details.dto';

describe('ops catalog multipart DTO parsing', () => {
  it('parses temple translations JSON from FormData', async () => {
    const dto = plainToInstance(CreateTempleDto, {
      email: 'temple@example.com',
      state: 'Kerala',
      description: 'Temple description',
      translations: JSON.stringify([
        {
          language: Language.EN,
          name: 'Temple name',
          district: 'Thrissur',
          place: 'Guruvayur',
          description: 'Temple description',
        },
      ]),
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.translations?.[0]).toMatchObject({
      language: Language.EN,
      name: 'Temple name',
    });
  });

  it('parses pooja arrays, translations, booleans, and numbers from FormData', async () => {
    const dto = plainToInstance(CreatePoojaDto, {
      templeId: 'temple-id',
      baseAmount: '500.5',
      poojaDay: 'MONDAY',
      time: '06:30',
      isWeekly: 'false',
      weeklyDiscount: '10',
      normalDiscount: '0',
      benefitIds: JSON.stringify(['benefit-id']),
      offeringIds: JSON.stringify(['offering-id']),
      translations: JSON.stringify([
        {
          language: Language.EN,
          name: 'Ganapathi Homam',
          about: 'Special pooja',
        },
      ]),
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto).toMatchObject({
      baseAmount: 500.5,
      isWeekly: false,
      weeklyDiscount: 10,
      normalDiscount: 0,
      benefitIds: ['benefit-id'],
      offeringIds: ['offering-id'],
    });
  });

  it('accepts omitted optional pooja offering IDs', async () => {
    const dto = plainToInstance(CreatePoojaDto, {
      templeId: 'temple-id',
      baseAmount: '500',
      poojaDay: 'MONDAY',
      time: '06:30',
      isWeekly: 'true',
      weeklyDiscount: '10',
      normalDiscount: '0',
      benefitIds: '["benefit-id"]',
      translations:
        '[{"language":"EN","name":"Ganapathi Homam","about":"Special pooja"}]',
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.offeringIds).toBeUndefined();
  });

  it('parses benifit translations JSON with an optional image contract', async () => {
    const dto = plainToInstance(CreateBenifitDto, {
      translations: JSON.stringify([
        {
          language: Language.EN,
          name: 'Prosperity',
          description: 'Growth and wellbeing',
        },
      ]),
    });

    expect(await validate(dto)).toHaveLength(0);
    expect(dto.translations[0].description).toBe('Growth and wellbeing');
  });
});

describe.each([
  TempleDetailsRequestDto,
  PoojaDetailsRequestDto,
  BenifitDetailsRequestDto,
])('ops identifier DTO %p', (Dto) => {
  it('accepts an ID without requiring a public slug', async () => {
    const dto = plainToInstance(Dto, {
      id: '8f83f33a-6d10-4af4-a4ad-4a506749d64c',
    });

    expect(await validate(dto)).toHaveLength(0);
  });
});
