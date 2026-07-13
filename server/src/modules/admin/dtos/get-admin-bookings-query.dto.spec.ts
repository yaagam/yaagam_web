import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { GetAdminBookingsQueryDto } from './get-admin-bookings-query.dto';

describe('GetAdminBookingsQueryDto', () => {
  it('allows excel-sized booking exports up to 500 rows', async () => {
    const dto = plainToInstance(GetAdminBookingsQueryDto, {
      page: '1',
      limit: '500',
    });

    await expect(validate(dto)).resolves.toHaveLength(0);
  });

  it('rejects booking page sizes above 500 rows', async () => {
    const dto = plainToInstance(GetAdminBookingsQueryDto, {
      page: '1',
      limit: '501',
    });

    await expect(validate(dto)).resolves.not.toHaveLength(0);
  });
});
