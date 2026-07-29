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

  it('rejects booking page sizes above 500 rows', async () => {
    const dto = plainToInstance(GetOpsBookingsQueryDto, {
      page: '1',
      limit: '501',
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
