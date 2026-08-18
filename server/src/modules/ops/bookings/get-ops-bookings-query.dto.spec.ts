import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetOpsBookingsQueryDto } from './get-ops-bookings-query.dto';

describe('GetOpsBookingsQueryDto', () => {
  it('allows excel-sized booking exports up to 500 rows', async () => {
    const dto = plainToInstance(GetOpsBookingsQueryDto, {
      page: '1',
      limit: '500',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('accepts booking and pooja date ranges', async () => {
    const dto = plainToInstance(GetOpsBookingsQueryDto, {
      bookingDateFrom: '2026-08-01T00:00:00.000Z',
      bookingDateTo: '2026-08-31T23:59:59.999Z',
      poojaDateFrom: '2026-09-01T00:00:00.000Z',
      poojaDateTo: '2026-09-30T23:59:59.999Z',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects booking page sizes above 500 rows', async () => {
    const dto = plainToInstance(GetOpsBookingsQueryDto, {
      page: '1',
      limit: '501',
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
