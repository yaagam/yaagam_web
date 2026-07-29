import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateCheckoutSessionDto } from './create-checkout-session.dto';

describe('CreateCheckoutSessionDto', () => {
  const validPayload = {
    poojaId: 'pooja-id',
    devotee: {
      devotees: [
        { name: 'Devotee One', naal: 'Aswathi' },
        { name: 'Devotee Two', naal: 'Bharani' },
      ],
      whatsappNumber: '9876543210',
      state: 'Kerala',
    },
    address: null,
  };

  it('accepts multiple devotees with paired names and naals', async () => {
    const dto = plainToInstance(CreateCheckoutSessionDto, validPayload);

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
