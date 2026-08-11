import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCheckoutSessionDto } from './create-checkout-session.dto';

describe('CreateCheckoutSessionDto', () => {
  const validPayload = {
    poojaSlug: 'pooja-slug',
    devotee: {
      devotees: [
        { name: 'Devotee One', naal: 'Aswathi' },
        { name: 'Devotee Two', naal: 'Bharani' },
      ],
      whatsappNumber: '+919876543210',
      state: 'Kerala',
    },
    address: null,
  };

  it('accepts multiple devotees with paired names and naals', async () => {
    const dto = plainToInstance(CreateCheckoutSessionDto, validPayload);

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('normalizes legacy Indian numbers and accepts international E.164 numbers', async () => {
    const indianDto = plainToInstance(CreateCheckoutSessionDto, {
      ...validPayload,
      devotee: { ...validPayload.devotee, whatsappNumber: '9876543210' },
    });
    const internationalDto = plainToInstance(
      CreateCheckoutSessionDto,
      validPayload,
    );

    await expect(validate(indianDto)).resolves.toHaveLength(0);
    await expect(validate(internationalDto)).resolves.toHaveLength(0);
    expect(indianDto.devotee.whatsappNumber).toBe('+919876543210');
  });

  it('accepts the state and E.164 phone sent in a delivery address', async () => {
    const dto = plainToInstance(CreateCheckoutSessionDto, {
      ...validPayload,
      address: {
        streetName: 'Temple Road',
        pincode: '680001',
        district: 'Thrissur',
        state: 'Kerala',
        phoneNumber: '+971501234567',
      },
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('requires at least one devotee', async () => {
    const dto = plainToInstance(CreateCheckoutSessionDto, {
      ...validPayload,
      devotee: { ...validPayload.devotee, devotees: [] },
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'devotee')).toBe(true);
  });

  it('rejects more than four devotees', async () => {
    const dto = plainToInstance(CreateCheckoutSessionDto, {
      ...validPayload,
      devotee: {
        ...validPayload.devotee,
        devotees: Array.from({ length: 5 }, (_, index) => ({
          name: `Devotee ${index + 1}`,
          naal: 'Aswathi',
        })),
      },
    });

    const errors = await validate(dto);

    expect(errors.some((error) => error.property === 'devotee')).toBe(true);
  });
});
