import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { SendOtpRequestDto } from './send-otp.dto';

describe('SendOtpRequestDto', () => {
  async function validateNumber(whatsappNumber: string) {
    const dto = plainToInstance(SendOtpRequestDto, { whatsappNumber });

    return validate(dto);
  }

  it.each([
    '9876543210',
    '+14155552671',
    '+447700900123',
    '+971501234567',
    '+61412345678',
    '+6581234567',
    '+966501234567',
  ])(
    'accepts supported international WhatsApp number %s',
    async (whatsappNumber) => {
      await expect(validateNumber(whatsappNumber)).resolves.toHaveLength(0);
    },
  );

  it.each([
    ['9876543210', '+919876543210'],
    ['09876543210', '+919876543210'],
    ['919876543210', '+919876543210'],
    ['+91 98765 43210', '+919876543210'],
  ])('normalizes %s to %s', async (input, expected) => {
    const dto = plainToInstance(SendOtpRequestDto, { whatsappNumber: input });

    await expect(validate(dto)).resolves.toHaveLength(0);
    expect(dto.whatsappNumber).toBe(expected);
  });

  it.each([
    '0123456789',
    '5123456789',
    '123456789',
    '98765432100',
    'abcdefghij',
    '+0123456789',
    '+1234567',
    '+1234567890123456',
  ])('rejects invalid mobile number %s', async (whatsappNumber) => {
    await expect(validateNumber(whatsappNumber)).resolves.not.toHaveLength(0);
  });
});
